// ============================================
// MediaRecorder Helpers for Webcam Recording
// ============================================

export interface RecorderResult {
  blob: Blob;
  mimeType: string;
  duration: number;
}

// Internal config for camera stream
interface RecorderConfig {
  video: boolean;
  audio: boolean;
}

// Supported MIME types in order of preference
const MIME_TYPE_PRIORITY = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
];

// Check if MediaRecorder is supported (internal use only)
function isMediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== 'undefined';
}

// Get the best supported MIME type (internal use only)
function getBestMimeType(): string | null {
  if (!isMediaRecorderSupported()) return null;

  for (const mimeType of MIME_TYPE_PRIORITY) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

/**
 * Request camera permissions and get stream
 */
export async function requestCameraStream(
  config: RecorderConfig = { video: true, audio: false }
): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: config.video
      ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
        }
      : false,
    audio: config.audio,
  };

  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Stop all tracks in a media stream
 */
export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Create a recorder class for managing recording state
 */
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private mimeType: string;
  private startTime: number = 0;
  private isRecording: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    this.mimeType = getBestMimeType() || 'video/webm';
  }

  /**
   * Initialize the recorder with a camera stream
   */
  async initialize(): Promise<MediaStream> {
    this.stream = await requestCameraStream({ video: true, audio: false });
    return this.stream;
  }

  /**
   * Start recording
   */
  start(): void {
    if (!this.stream) {
      throw new Error('Recorder not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      return;
    }

    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: this.mimeType,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.startTime = Date.now();
    this.isRecording = true;
  }

  /**
   * Stop recording and return the result
   */
  async stop(): Promise<RecorderResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType });
        const duration = Date.now() - this.startTime;

        this.isRecording = false;
        this.chunks = [];

        resolve({
          blob,
          mimeType: this.mimeType,
          duration,
        });
      };

      this.mediaRecorder.onerror = (event) => {
        this.isRecording = false;
        reject(new Error(`Recording error: ${event}`));
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (!this.mediaRecorder || !this.isRecording || this.isPaused) {
      return;
    }

    this.mediaRecorder.pause();
    this.isPaused = true;
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (!this.mediaRecorder || !this.isRecording || !this.isPaused) {
      return;
    }

    this.mediaRecorder.resume();
    this.isPaused = false;
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if currently paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Get the current stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      stopStream(this.stream);
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
  }
}

/**
 * Create a blob URL for video playback
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke a blob URL to free memory
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4')) return 'mp4';
  return 'webm';
}

