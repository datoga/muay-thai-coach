import type {
  UserSettings,
  CalibrationData,
  MusicSettings,
  TrainingSettings,
  SessionData,
  AnalysisQuality,
  AnalysisQualityPreset,
} from './types';
import {
  DEFAULT_TRAINING_SETTINGS,
  DEFAULT_ANALYSIS_QUALITY,
  ANALYSIS_QUALITY_PRESETS,
} from './types';

// Storage keys
const SETTINGS_KEY = 'muay-thai-coach-settings';
const HISTORY_KEY = 'muay-thai-coach-history';
const DRIVE_FOLDER_KEY = 'muay-thai-coach-drive-folder';

// Current schema version for migration support
const CURRENT_VERSION = 1;

// ============================================
// Settings Management
// ============================================

const DEFAULT_SETTINGS: UserSettings = {
  version: CURRENT_VERSION,
  locale: 'en',
  theme: 'system',
  calibration: null,
  music: {
    mode: 'off',
    volume: 0.7,
    selectedLoop: null,
    spotifyEmbedUrl: null,
  },
  training: DEFAULT_TRAINING_SETTINGS,
  analysisQuality: DEFAULT_ANALYSIS_QUALITY,
};

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const settings = JSON.parse(stored) as UserSettings;
    let needsSave = false;

    // Migration: add training settings if missing or incomplete
    if (!settings.training) {
      settings.training = DEFAULT_TRAINING_SETTINGS;
      needsSave = true;
    } else {
      // Migrate from old format (roundDurationSec) to new format (level-specific)
      const training = settings.training as TrainingSettings & { roundDurationSec?: number };
      if (training.level1DurationSec === undefined) {
        settings.training = {
          level1DurationSec: DEFAULT_TRAINING_SETTINGS.level1DurationSec,
          level2DurationSec: DEFAULT_TRAINING_SETTINGS.level2DurationSec,
          level3DurationSec: DEFAULT_TRAINING_SETTINGS.level3DurationSec,
          restDurationSec: training.restDurationSec ?? DEFAULT_TRAINING_SETTINGS.restDurationSec,
        };
        needsSave = true;
      }
    }

    // Migration: clean up music settings (remove metronome)
    if (settings.music) {
      const music = settings.music as MusicSettings & { metronomeBpm?: number };
      if (music.metronomeBpm !== undefined) {
        delete music.metronomeBpm;
        needsSave = true;
      }
      // If mode was 'metronome', reset to 'off'
      if ((music.mode as string) === 'metronome') {
        music.mode = 'off';
        needsSave = true;
      }
    }

    // Migration: add analysisQuality if missing
    if (!settings.analysisQuality) {
      settings.analysisQuality = DEFAULT_ANALYSIS_QUALITY;
      needsSave = true;
    }

    // Migration logic for future schema changes
    if (settings.version < CURRENT_VERSION) {
      return migrateSettings(settings);
    }

    // Save migrated settings
    if (needsSave) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function updateSettings(partial: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const updated = { ...current, ...partial };
  saveSettings(updated);
  return updated;
}

function migrateSettings(settings: UserSettings): UserSettings {
  // Add migration logic here when schema changes
  // For now, just update version
  const migrated = { ...settings, version: CURRENT_VERSION };
  saveSettings(migrated);
  return migrated;
}

// ============================================
// Calibration Management
// ============================================

export function getCalibration(): CalibrationData | null {
  return getSettings().calibration;
}

export function saveCalibration(calibration: CalibrationData): void {
  const settings = getSettings();
  settings.calibration = calibration;
  saveSettings(settings);
}

export function clearCalibration(): void {
  const settings = getSettings();
  settings.calibration = null;
  saveSettings(settings);
}

export function hasCalibration(): boolean {
  return getCalibration() !== null;
}

// ============================================
// Music Settings Management
// ============================================

export function getMusicSettings(): MusicSettings {
  return getSettings().music;
}

export function saveMusicSettings(music: MusicSettings): void {
  const settings = getSettings();
  settings.music = music;
  saveSettings(settings);
}

// ============================================
// Training Settings Management
// ============================================

export function getTrainingSettings(): TrainingSettings {
  return getSettings().training;
}

export function saveTrainingSettings(training: TrainingSettings): void {
  const settings = getSettings();
  settings.training = training;
  saveSettings(settings);
}

export function getRoundDuration(level: 1 | 2 | 3): number {
  const training = getTrainingSettings();
  let duration: number;
  
  switch (level) {
    case 1:
      duration = training.level1DurationSec;
      break;
    case 2:
      duration = training.level2DurationSec;
      break;
    case 3:
      duration = training.level3DurationSec;
      break;
    default:
      duration = 180;
  }
  
  // Fallback in case of NaN or undefined
  if (isNaN(duration) || duration === undefined) {
    return level === 1 ? 60 : level === 2 ? 120 : 180;
  }
  
  return duration;
}

export function setRoundDuration(level: 1 | 2 | 3, seconds: number): void {
  const training = getTrainingSettings();
  switch (level) {
    case 1:
      training.level1DurationSec = seconds;
      break;
    case 2:
      training.level2DurationSec = seconds;
      break;
    case 3:
      training.level3DurationSec = seconds;
      break;
  }
  saveTrainingSettings(training);
}

// ============================================
// Analysis Quality Settings Management
// ============================================

export function getAnalysisQuality(): AnalysisQuality {
  return getSettings().analysisQuality;
}

export function saveAnalysisQuality(quality: AnalysisQuality): void {
  const settings = getSettings();
  settings.analysisQuality = quality;
  saveSettings(settings);
}

export function getAnalysisQualityPreset(): AnalysisQualityPreset {
  const quality = getAnalysisQuality();
  return ANALYSIS_QUALITY_PRESETS[quality];
}

// ============================================
// Session History Management
// ============================================

export function getHistory(): SessionData[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SessionData[];
  } catch {
    return [];
  }
}

export function addToHistory(session: SessionData): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    history.unshift(session); // Add to beginning
    // Keep only last 50 sessions
    const trimmed = history.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

export function deleteSession(sessionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    const filtered = history.filter((s) => s.id !== sessionId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
}

export function updateSession(sessionId: string, updates: Partial<SessionData>): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    const index = history.findIndex((s) => s.id === sessionId);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to update session:', error);
  }
}

// ============================================
// Drive Folder Cache
// ============================================

export function getCachedDriveFolderId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DRIVE_FOLDER_KEY);
}

export function setCachedDriveFolderId(folderId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRIVE_FOLDER_KEY, folderId);
}

export function clearCachedDriveFolderId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRIVE_FOLDER_KEY);
}

// ============================================
// Gloves Toggle (Quick Access)
// ============================================

export function isWearingGloves(): boolean {
  return getCalibration()?.wearingGloves ?? false;
}

export function setWearingGloves(wearing: boolean): void {
  const calibration = getCalibration();
  if (calibration) {
    saveCalibration({ ...calibration, wearingGloves: wearing });
  }
}

export function getStance(): 'orthodox' | 'southpaw' {
  return getCalibration()?.stance ?? 'orthodox';
}

export function setStance(stance: 'orthodox' | 'southpaw'): void {
  const calibration = getCalibration();
  if (calibration) {
    saveCalibration({ ...calibration, stance });
  }
}

// ============================================
// Generate Session ID
// ============================================

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

