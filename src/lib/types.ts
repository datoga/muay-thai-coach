// ============================================
// Core Types for Muay Thai Coach
// ============================================

// Locale types
export type Locale = 'en' | 'es';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Stance types
export type Stance = 'orthodox' | 'southpaw';

// View angle types
export type ViewAngle = 'front' | 'three-quarter' | 'side';

// Move types
export type MoveType = 'punch' | 'kick' | 'knee' | 'elbow' | 'defensive';

// Side indicator (for orthodox stance - mirrored for southpaw)
// 'lead' = front side (left for orthodox, right for southpaw)
// 'rear' = back side (right for orthodox, left for southpaw)
export type MoveSide = 'lead' | 'rear';

// ============================================
// Move Definition
// ============================================
export interface Move {
  id: string;
  nameKey: string; // i18n key
  type: MoveType;
  side: MoveSide; // which side performs the move
  cueKeys: string[]; // i18n keys for coaching cues
  keyframes: AvatarKeyframe[];
  duration: number; // ms
}

// ============================================
// Combo Definition
// ============================================
export interface Combo {
  id: string;
  level: 1 | 2 | 3;
  nameKey: string; // i18n key
  moveIds: string[];
  tipKeys: string[]; // i18n keys
}

// ============================================
// Avatar Keyframe for Stickman Animation
// ============================================
export interface AvatarKeyframe {
  time: number; // 0-1 progress
  pose: AvatarPose;
}

export interface AvatarPose {
  // Joint positions relative to body center (normalized -1 to 1)
  head: Point2D;
  leftShoulder: Point2D;
  rightShoulder: Point2D;
  leftElbow: Point2D;
  rightElbow: Point2D;
  leftWrist: Point2D;
  rightWrist: Point2D;
  leftHip: Point2D;
  rightHip: Point2D;
  leftKnee: Point2D;
  rightKnee: Point2D;
  leftAnkle: Point2D;
  rightAnkle: Point2D;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

// ============================================
// Calibration Data
// ============================================
export interface CalibrationData {
  version: number;
  timestamp: number;
  viewAngle: ViewAngle;
  stance: Stance;
  wearingGloves: boolean;
  baselineScale: number; // shoulder distance
  baselineGuardHeight: number; // wrist y relative to nose y
  framingQuality: FramingQuality;
}

export interface FramingQuality {
  headVisible: boolean;
  hipsVisible: boolean;
  anklesVisible: boolean;
  overallScore: number; // 0-100
}

// ============================================
// Session Data
// ============================================
export interface SessionData {
  id: string;
  comboId: string;
  timestamp: number;
  score: SessionScore | null;
  driveFileId: string | null;
  driveWebViewLink: string | null;
  hasLocalVideo?: boolean; // True if video is stored locally in IndexedDB
  isAnalyzing?: boolean; // True while background analysis is in progress
  analysisProgress?: number; // 0-100 progress percentage
}

export interface SessionScore {
  overall: number; // 0-100
  guard: number; // 0-25
  stability: number; // 0-20
  execution: number; // 0-40
  timing: number; // 0-15
  strengths: string[]; // i18n keys
  improvements: string[]; // i18n keys
  warnings: string[]; // i18n keys
}

// ============================================
// Pose Analysis Types
// ============================================
export interface PoseFrame {
  timestamp: number;
  landmarks: NormalizedLandmark[];
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface AnalysisResult {
  frameCount: number;
  duration: number;
  score: SessionScore;
  frames: PoseFrame[];
}

// ============================================
// Music Settings
// ============================================
export type MusicMode = 'off' | 'loop' | 'spotify-embed';

export interface MusicSettings {
  mode: MusicMode;
  volume: number; // 0-1
  selectedLoop: string | null;
  spotifyEmbedUrl: string | null;
}

// ============================================
// Training Settings
// ============================================
export interface TrainingSettings {
  // Round duration per level (in seconds)
  level1DurationSec: number; // Beginner: 1 min
  level2DurationSec: number; // Intermediate: 2 min
  level3DurationSec: number; // Advanced: 3 min
  restDurationSec: number;   // Default 60 (1 min)
}

export const DEFAULT_TRAINING_SETTINGS: TrainingSettings = {
  level1DurationSec: 60,   // 1 minute for beginners
  level2DurationSec: 120,  // 2 minutes for intermediate
  level3DurationSec: 180,  // 3 minutes for advanced
  restDurationSec: 60,     // 1 minute rest
};

// ============================================
// Analysis Quality Settings
// ============================================
export type AnalysisQuality = 'fast' | 'balanced' | 'maximum';

export interface AnalysisQualityPreset {
  model: 'lite' | 'full' | 'heavy';
  modelUrl: string;
  fps: number;
  maxDurationSec: number;
  minPoseDetectionConfidence: number;
  minPosePresenceConfidence: number;
  minTrackingConfidence: number;
}

export const ANALYSIS_QUALITY_PRESETS: Record<AnalysisQuality, AnalysisQualityPreset> = {
  fast: {
    model: 'lite',
    modelUrl: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    fps: 10,
    maxDurationSec: 60,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  },
  balanced: {
    model: 'full',
    modelUrl: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
    fps: 15,
    maxDurationSec: 180,
    minPoseDetectionConfidence: 0.6,
    minPosePresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
  },
  maximum: {
    model: 'heavy',
    modelUrl: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
    fps: 30,
    maxDurationSec: 300, // 5 minutes max
    minPoseDetectionConfidence: 0.8,
    minPosePresenceConfidence: 0.8,
    minTrackingConfidence: 0.8,
  },
};

export const DEFAULT_ANALYSIS_QUALITY: AnalysisQuality = 'balanced';

// ============================================
// Settings Storage
// ============================================
export interface UserSettings {
  version: number;
  locale: Locale;
  theme: Theme;
  calibration: CalibrationData | null;
  music: MusicSettings;
  training: TrainingSettings;
  analysisQuality: AnalysisQuality;
}

// ============================================
// Session Phase Types
// ============================================
export type SessionPhase = 'calibration' | 'learn' | 'practice' | 'review';

export interface SessionState {
  comboId: string;
  phase: SessionPhase;
  recordedBlob: Blob | null;
  analysisResult: AnalysisResult | null;
  driveUploadResult: DriveUploadResult | null;
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  name: string;
}

// ============================================
// Auth Types (Extended Session)
// ============================================
export interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  accessToken?: string;
  expires: string;
}

