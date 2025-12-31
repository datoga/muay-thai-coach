// ============================================
// IndexedDB Video Storage
// Stores recorded videos locally for playback
// ============================================

const DB_NAME = 'muay-thai-coach-videos';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

// Default max videos to keep
const DEFAULT_MAX_VIDEOS = 10;

interface StoredVideo {
  sessionId: string;
  blob: Blob;
  mimeType: string;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Open or create the IndexedDB database
 */
async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save a video blob for a session
 */
export async function saveVideo(sessionId: string, blob: Blob): Promise<void> {
  const db = await openDB();

  const video: StoredVideo = {
    sessionId,
    blob,
    mimeType: blob.type,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(video);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Cleanup old videos after saving
      cleanupOldVideos().then(resolve).catch(reject);
    };
  });
}

/**
 * Get a video blob for a session
 */
export async function getVideo(sessionId: string): Promise<Blob | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(sessionId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as StoredVideo | undefined;
      resolve(result?.blob || null);
    };
  });
}

/**
 * Delete a video for a session
 */
export async function deleteVideo(sessionId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(sessionId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all stored video session IDs
 */
export async function getAllVideoIds(): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result as string[]);
    };
  });
}

/**
 * Get max videos setting from localStorage
 */
export function getMaxVideos(): number {
  if (typeof window === 'undefined') return DEFAULT_MAX_VIDEOS;
  
  try {
    const stored = localStorage.getItem('muay-thai-coach-max-videos');
    if (stored) {
      const value = parseInt(stored, 10);
      if (!isNaN(value) && value > 0) return value;
    }
  } catch {
    // Ignore errors
  }
  
  return DEFAULT_MAX_VIDEOS;
}

/**
 * Set max videos setting
 */
export function setMaxVideos(count: number): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('muay-thai-coach-max-videos', count.toString());
}

/**
 * Cleanup old videos, keeping only the most recent N
 */
async function cleanupOldVideos(): Promise<void> {
  const db = await openDB();
  const maxVideos = getMaxVideos();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    // Get all videos sorted by timestamp (oldest first)
    const request = index.openCursor();
    const videosToDelete: string[] = [];
    let count = 0;

    // First, count total videos
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      const totalCount = countRequest.result;
      const deleteCount = Math.max(0, totalCount - maxVideos);
      
      if (deleteCount === 0) {
        resolve();
        return;
      }

      // Collect oldest videos to delete
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && count < deleteCount) {
          videosToDelete.push(cursor.value.sessionId);
          count++;
          cursor.continue();
        } else {
          // Delete collected videos
          videosToDelete.forEach((id) => {
            store.delete(id);
          });
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    };

    countRequest.onerror = () => reject(countRequest.error);
  });
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(): Promise<{ count: number; sizeBytes: number }> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const videos = request.result as StoredVideo[];
      const sizeBytes = videos.reduce((acc, v) => acc + v.blob.size, 0);
      resolve({ count: videos.length, sizeBytes });
    };
  });
}

/**
 * Create a blob URL for a session's video
 */
export async function createVideoUrl(sessionId: string): Promise<string | null> {
  const blob = await getVideo(sessionId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/**
 * Check if a session has a local video
 */
export async function hasLocalVideo(sessionId: string): Promise<boolean> {
  const blob = await getVideo(sessionId);
  return blob !== null;
}

