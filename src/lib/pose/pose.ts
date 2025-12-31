// ============================================
// MediaPipe Pose Landmarker Initialization
// ============================================

import {
  PoseLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import type { NormalizedLandmark, PoseFrame, AnalysisQualityPreset } from '../types';
import { getAnalysisQualityPreset } from '../settings';

// Singleton instance
let poseLandmarker: PoseLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<PoseLandmarker> | null = null;
let currentModelUrl: string | null = null;

// Landmark indices for key body parts
export const LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * Initialize the PoseLandmarker singleton with quality preset
 * @param preset - Optional preset override. If not provided, uses saved settings.
 */
export async function initPoseLandmarker(preset?: AnalysisQualityPreset): Promise<PoseLandmarker> {
  const qualityPreset = preset || getAnalysisQualityPreset();
  
  // Return existing instance if same model
  if (poseLandmarker && currentModelUrl === qualityPreset.modelUrl) {
    return poseLandmarker;
  }

  // Close existing instance if model changed
  if (poseLandmarker && currentModelUrl !== qualityPreset.modelUrl) {
    poseLandmarker.close();
    poseLandmarker = null;
    initPromise = null;
  }

  // Wait for existing initialization
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  currentModelUrl = qualityPreset.modelUrl;

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: qualityPreset.modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: qualityPreset.minPoseDetectionConfidence,
      minPosePresenceConfidence: qualityPreset.minPosePresenceConfidence,
      minTrackingConfidence: qualityPreset.minTrackingConfidence,
    });

    isInitializing = false;
    return poseLandmarker;
  })();

  return initPromise;
}

/**
 * Get the PoseLandmarker instance (must be initialized first)
 */
export function getPoseLandmarker(): PoseLandmarker | null {
  return poseLandmarker;
}

/**
 * Detect pose in a video frame
 * @param video - Video element to detect pose from
 * @param timestamp - Current timestamp in milliseconds
 * @param preset - Optional quality preset override
 */
export async function detectPose(
  video: HTMLVideoElement,
  timestamp: number,
  preset?: AnalysisQualityPreset
): Promise<NormalizedLandmark[] | null> {
  const landmarker = await initPoseLandmarker(preset);

  try {
    const result = landmarker.detectForVideo(video, timestamp);

    if (result.landmarks && result.landmarks.length > 0) {
      return result.landmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));
    }

    return null;
  } catch (error) {
    console.error('Pose detection error:', error);
    return null;
  }
}

// Track the last timestamp used to ensure strictly monotonically increasing values
let lastTimestamp = 0;

/**
 * Analyze a video blob and extract pose frames
 * Uses quality settings from user preferences unless overridden
 * @param blob - Video blob to analyze
 * @param onProgress - Progress callback (0-100)
 * @param presetOverride - Optional quality preset override
 */
export async function analyzeVideoBlob(
  blob: Blob,
  onProgress?: (progress: number) => void,
  presetOverride?: AnalysisQualityPreset
): Promise<PoseFrame[]> {
  const preset = presetOverride || getAnalysisQualityPreset();
  const targetFps = preset.fps;
  const maxDurationSec = preset.maxDurationSec;
  
  const frames: PoseFrame[] = [];
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;

  // Reset timestamp tracker for new analysis
  lastTimestamp = 0;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    video.src = url;

    video.onloadedmetadata = async () => {
      const duration = Math.min(video.duration, maxDurationSec);
      const frameInterval = 1000 / targetFps;
      let currentTime = 0;
      const totalFrames = Math.floor((duration * 1000) / frameInterval);
      let processedFrames = 0;

      // Initialize pose landmarker with preset
      await initPoseLandmarker(preset);

      const processFrame = async () => {
        if (currentTime > duration) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;

        await new Promise<void>((resolveSeek) => {
          video.onseeked = () => resolveSeek();
        });

        // Ensure timestamp is strictly monotonically increasing and >= 1
        const timestamp = Math.max(Math.floor(currentTime * 1000) + 1, lastTimestamp + 1);
        lastTimestamp = timestamp;

        const landmarks = await detectPose(video, timestamp, preset);

        if (landmarks) {
          frames.push({
            timestamp: currentTime * 1000,
            landmarks,
          });
        }

        processedFrames++;
        if (onProgress) {
          onProgress(Math.round((processedFrames / totalFrames) * 100));
        }

        currentTime += frameInterval / 1000;
        await processFrame();
      };

      try {
        await processFrame();
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}

/**
 * Draw skeleton overlay on canvas
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  color: string = '#00ff00'
): void {
  // Convert to MediaPipe format
  const mpLandmarks = landmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility,
  }));

  // Draw connections
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Define connections
  const connections = [
    // Face
    [LANDMARK_INDICES.LEFT_EAR, LANDMARK_INDICES.LEFT_EYE],
    [LANDMARK_INDICES.RIGHT_EAR, LANDMARK_INDICES.RIGHT_EYE],
    // Torso
    [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.RIGHT_SHOULDER],
    [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_HIP],
    [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_HIP],
    [LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.RIGHT_HIP],
    // Left arm
    [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_ELBOW],
    [LANDMARK_INDICES.LEFT_ELBOW, LANDMARK_INDICES.LEFT_WRIST],
    // Right arm
    [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_ELBOW],
    [LANDMARK_INDICES.RIGHT_ELBOW, LANDMARK_INDICES.RIGHT_WRIST],
    // Left leg
    [LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.LEFT_KNEE],
    [LANDMARK_INDICES.LEFT_KNEE, LANDMARK_INDICES.LEFT_ANKLE],
    // Right leg
    [LANDMARK_INDICES.RIGHT_HIP, LANDMARK_INDICES.RIGHT_KNEE],
    [LANDMARK_INDICES.RIGHT_KNEE, LANDMARK_INDICES.RIGHT_ANKLE],
  ];

  ctx.beginPath();
  connections.forEach(([start, end]) => {
    const startLm = mpLandmarks[start];
    const endLm = mpLandmarks[end];
    if (startLm && endLm) {
      ctx.moveTo(startLm.x * width, startLm.y * height);
      ctx.lineTo(endLm.x * width, endLm.y * height);
    }
  });
  ctx.stroke();

  // Draw landmarks
  ctx.fillStyle = color;
  mpLandmarks.forEach((lm) => {
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
}

/**
 * Cleanup pose landmarker
 */
export function closePoseLandmarker(): void {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  isInitializing = false;
  initPromise = null;
  currentModelUrl = null;
  lastTimestamp = 0; // Reset timestamp tracker
}

