// ============================================
// Google Drive API Helpers
// ============================================

import { getCachedDriveFolderId, setCachedDriveFolderId } from './settings';
import { getFileExtension } from './recorder';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'MuayThaiCoach';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export interface DriveFile {
  fileId: string;
  name: string;
  webViewLink: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * Find or create the MuayThaiCoach folder
 */
export async function getOrCreateFolder(accessToken: string): Promise<string> {
  // Check cache first
  const cachedFolderId = getCachedDriveFolderId();
  if (cachedFolderId) {
    // Verify folder still exists
    try {
      const response = await fetch(`${DRIVE_API_BASE}/files/${cachedFolderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        return cachedFolderId;
      }
    } catch {
      // Folder doesn't exist, continue to search/create
    }
  }

  // Search for existing folder
  const searchParams = new URLSearchParams({
    q: `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const searchResponse = await fetch(
    `${DRIVE_API_BASE}/files?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error(`Failed to search for folder: ${searchResponse.statusText}`);
  }

  const searchResult = await searchResponse.json();

  if (searchResult.files && searchResult.files.length > 0) {
    const folderId = searchResult.files[0].id;
    setCachedDriveFolderId(folderId);
    return folderId;
  }

  // Create new folder
  const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: FOLDER_MIME_TYPE,
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create folder: ${createResponse.statusText}`);
  }

  const folder = await createResponse.json();
  setCachedDriveFolderId(folder.id);
  return folder.id;
}

/**
 * Upload a video file to Google Drive using resumable upload
 */
export async function uploadVideo(
  accessToken: string,
  blob: Blob,
  fileName: string,
  folderId: string,
  onProgress?: UploadProgressCallback
): Promise<DriveFile> {
  const extension = getFileExtension(blob.type);
  const fullFileName = `${fileName}.${extension}`;

  // Step 1: Initiate resumable upload session
  const initResponse = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=resumable`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': blob.type,
        'X-Upload-Content-Length': blob.size.toString(),
      },
      body: JSON.stringify({
        name: fullFileName,
        parents: [folderId],
      }),
    }
  );

  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`Failed to initiate upload: ${error}`);
  }

  const uploadUrl = initResponse.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('No upload URL returned');
  }

  // Step 2: Upload the file
  // For MVP, we do a simple PUT of the entire blob
  // A more robust implementation would chunk the upload
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': blob.type,
      'Content-Length': blob.size.toString(),
    },
    body: blob,
  });

  // Report progress (simplified for direct upload)
  if (onProgress) {
    onProgress({
      loaded: blob.size,
      total: blob.size,
      percentage: 100,
    });
  }

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Failed to upload file: ${error}`);
  }

  const fileData = await uploadResponse.json();

  // Get the web view link
  const fileResponse = await fetch(
    `${DRIVE_API_BASE}/files/${fileData.id}?fields=id,name,webViewLink`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!fileResponse.ok) {
    // Return what we have even if we can't get the link
    return {
      fileId: fileData.id,
      name: fullFileName,
      webViewLink: `https://drive.google.com/file/d/${fileData.id}/view`,
    };
  }

  const fileInfo = await fileResponse.json();

  return {
    fileId: fileInfo.id,
    name: fileInfo.name,
    webViewLink:
      fileInfo.webViewLink ||
      `https://drive.google.com/file/d/${fileInfo.id}/view`,
  };
}

/**
 * Full upload flow: get/create folder + upload video
 */
export async function uploadVideoToDrive(
  accessToken: string,
  blob: Blob,
  comboId: string,
  onProgress?: UploadProgressCallback
): Promise<DriveFile> {
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${comboId}_${timestamp}`;

  // Get or create folder
  const folderId = await getOrCreateFolder(accessToken);

  // Upload video
  return uploadVideo(accessToken, blob, fileName, folderId, onProgress);
}

