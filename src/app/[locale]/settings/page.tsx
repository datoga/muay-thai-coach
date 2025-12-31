'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { CalibrationData, MusicSettings, TrainingSettings, AnalysisQuality } from '@/lib/types';
import type { Stance } from '@/lib/types';
import { ANALYSIS_QUALITY_PRESETS } from '@/lib/types';
import {
  getCalibration,
  clearCalibration,
  getMusicSettings,
  saveMusicSettings,
  getTrainingSettings,
  saveTrainingSettings,
  getAnalysisQuality,
  saveAnalysisQuality,
  clearHistory,
  setWearingGloves,
  setStance,
} from '@/lib/settings';
import { getMaxVideos, setMaxVideos, getStorageInfo } from '@/lib/videoStorage';

export default function SettingsPage() {
  const t = useTranslations();
  const router = useRouter();

  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [musicSettings, setMusicSettings] = useState<MusicSettings | null>(null);
  const [trainingSettings, setTrainingSettings] = useState<TrainingSettings | null>(null);
  const [analysisQuality, setAnalysisQualityState] = useState<AnalysisQuality>('balanced');
  const [showConfirmClear, setShowConfirmClear] = useState<string | null>(null);
  const [maxVideos, setMaxVideosState] = useState(10);
  const [storageInfo, setStorageInfo] = useState<{ count: number; sizeBytes: number } | null>(null);

  useEffect(() => {
    setCalibration(getCalibration());
    setMusicSettings(getMusicSettings());
    setTrainingSettings(getTrainingSettings());
    setAnalysisQualityState(getAnalysisQuality());
    setMaxVideosState(getMaxVideos());
    
    // Load storage info
    getStorageInfo()
      .then(setStorageInfo)
      .catch(() => setStorageInfo(null));
  }, []);

  const handleRecalibrate = () => {
    // Clear calibration and redirect to a session (which will trigger calibration)
    clearCalibration();
    router.push('/session/l1-jab-cross');
  };

  const handleGlovesToggle = (wearing: boolean) => {
    setWearingGloves(wearing);
    setCalibration((prev) => (prev ? { ...prev, wearingGloves: wearing } : null));
  };

  const handleStanceToggle = (stance: Stance) => {
    setStance(stance);
    setCalibration((prev) => (prev ? { ...prev, stance } : null));
  };

  const handleMusicSettingsChange = (key: keyof MusicSettings, value: number) => {
    if (!musicSettings) return;
    const newSettings = { ...musicSettings, [key]: value };
    setMusicSettings(newSettings);
    saveMusicSettings(newSettings);
  };

  const handleTrainingSettingsChange = (key: keyof TrainingSettings, value: number) => {
    if (!trainingSettings) return;
    const newSettings = { ...trainingSettings, [key]: value };
    setTrainingSettings(newSettings);
    saveTrainingSettings(newSettings);
  };

  const handleAnalysisQualityChange = (quality: AnalysisQuality) => {
    setAnalysisQualityState(quality);
    saveAnalysisQuality(quality);
  };

  const handleMaxVideosChange = (value: number) => {
    setMaxVideosState(value);
    setMaxVideos(value);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins} min`;
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowConfirmClear(null);
  };

  const handleClearCalibration = () => {
    clearCalibration();
    setCalibration(null);
    setShowConfirmClear(null);
  };

  const viewAngleLabel = (angle: string) => {
    switch (angle) {
      case 'front':
        return t('session.calibration.viewAngle.front');
      case 'three-quarter':
        return t('session.calibration.viewAngle.threeQuarter');
      case 'side':
        return t('session.calibration.viewAngle.side');
      default:
        return angle;
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 font-display text-3xl tracking-wide text-foreground">
        {t('settings.title')}
      </h1>

      <div className="space-y-6">
        {/* Calibration */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-foreground">
            {t('settings.calibration.title')}
          </h2>

          {calibration ? (
            <div className="space-y-4">
              {/* View angle (requires recalibration to change) */}
              <div className="rounded-lg bg-muted p-3">
                <div className="text-xs text-muted-foreground">
                  {t('settings.calibration.viewAngle')}
                </div>
                <div className="font-medium text-foreground">
                  📷 {viewAngleLabel(calibration.viewAngle)}
                </div>
              </div>

              {/* Stance toggle */}
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div>
                  <div className="font-medium text-foreground">
                    {t('session.calibration.stance.title')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('settings.calibration.stanceHelp')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStanceToggle('orthodox')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      calibration.stance === 'orthodox'
                        ? 'bg-primary-600 text-white'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                    title={t('session.calibration.stance.orthodox')}
                  >
                    🥊 {t('session.calibration.stance.orthodox').split(' ')[0]}
                  </button>
                  <button
                    onClick={() => handleStanceToggle('southpaw')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      calibration.stance === 'southpaw'
                        ? 'bg-primary-600 text-white'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                    title={t('session.calibration.stance.southpaw')}
                  >
                    🥊 {t('session.calibration.stance.southpaw').split(' ')[0]}
                  </button>
                </div>
              </div>

              {/* Gloves toggle */}
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div>
                  <div className="font-medium text-foreground">
                    {t('session.calibration.gloves.title')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('settings.calibration.glovesHelp')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGlovesToggle(true)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      calibration.wearingGloves
                        ? 'bg-primary-600 text-white'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🥊 {t('common.yes')}
                  </button>
                  <button
                    onClick={() => handleGlovesToggle(false)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      !calibration.wearingGloves
                        ? 'bg-primary-600 text-white'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ✊ {t('common.no')}
                  </button>
                </div>
              </div>

              <button
                onClick={handleRecalibrate}
                className="w-full rounded-lg border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                🔄 {t('settings.calibration.recalibrate')}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-4 text-muted-foreground">
                {t('settings.calibration.notCalibrated')}
              </p>
              <button
                onClick={handleRecalibrate}
                className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                Start Calibration
              </button>
            </div>
          )}
        </section>

        {/* Training settings */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-foreground">
            {t('settings.training.title')}
          </h2>

          {trainingSettings && (
            <div className="space-y-6">
              {/* Level 1 - Beginner */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                    {t('dashboard.levels.1')}
                  </span>
                  {formatDuration(trainingSettings.level1DurationSec)}
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="30"
                  value={trainingSettings.level1DurationSec}
                  onChange={(e) =>
                    handleTrainingSettingsChange('level1DurationSec', parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Level 2 - Intermediate */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                    {t('dashboard.levels.2')}
                  </span>
                  {formatDuration(trainingSettings.level2DurationSec)}
                </label>
                <input
                  type="range"
                  min="60"
                  max="240"
                  step="30"
                  value={trainingSettings.level2DurationSec}
                  onChange={(e) =>
                    handleTrainingSettingsChange('level2DurationSec', parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Level 3 - Advanced */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
                    {t('dashboard.levels.3')}
                  </span>
                  {formatDuration(trainingSettings.level3DurationSec)}
                </label>
                <input
                  type="range"
                  min="120"
                  max="300"
                  step="30"
                  value={trainingSettings.level3DurationSec}
                  onChange={(e) =>
                    handleTrainingSettingsChange('level3DurationSec', parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Rest duration */}
              <div className="border-t border-border pt-4">
                <label className="mb-2 block text-sm text-muted-foreground">
                  {t('settings.training.restDuration')}: {formatDuration(trainingSettings.restDurationSec)}
                </label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={trainingSettings.restDurationSec}
                  onChange={(e) =>
                    handleTrainingSettingsChange('restDurationSec', parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}
        </section>

        {/* Analysis Quality */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-foreground">
            {t('settings.analysis.title')}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('settings.analysis.description')}
          </p>

          <div className="space-y-3">
            {/* Fast */}
            <button
              onClick={() => handleAnalysisQualityChange('fast')}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                analysisQuality === 'fast'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span className="font-medium text-foreground">
                      {t('settings.analysis.fast.title')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('settings.analysis.fast.description')}
                  </p>
                </div>
                {analysisQuality === 'fast' && (
                  <span className="text-primary-500">✓</span>
                )}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>{ANALYSIS_QUALITY_PRESETS.fast.fps} FPS</span>
                <span>•</span>
                <span>{ANALYSIS_QUALITY_PRESETS.fast.maxDurationSec}s max</span>
                <span>•</span>
                <span>{t('settings.analysis.fast.model')}</span>
              </div>
            </button>

            {/* Balanced */}
            <button
              onClick={() => handleAnalysisQualityChange('balanced')}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                analysisQuality === 'balanced'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚖️</span>
                    <span className="font-medium text-foreground">
                      {t('settings.analysis.balanced.title')}
                    </span>
                    <span className="rounded bg-primary-500/20 px-2 py-0.5 text-xs text-primary-600 dark:text-primary-400">
                      {t('settings.analysis.recommended')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('settings.analysis.balanced.description')}
                  </p>
                </div>
                {analysisQuality === 'balanced' && (
                  <span className="text-primary-500">✓</span>
                )}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>{ANALYSIS_QUALITY_PRESETS.balanced.fps} FPS</span>
                <span>•</span>
                <span>{ANALYSIS_QUALITY_PRESETS.balanced.maxDurationSec}s max</span>
                <span>•</span>
                <span>{t('settings.analysis.balanced.model')}</span>
              </div>
            </button>

            {/* Maximum */}
            <button
              onClick={() => handleAnalysisQualityChange('maximum')}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                analysisQuality === 'maximum'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium text-foreground">
                      {t('settings.analysis.maximum.title')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('settings.analysis.maximum.description')}
                  </p>
                </div>
                {analysisQuality === 'maximum' && (
                  <span className="text-primary-500">✓</span>
                )}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>{ANALYSIS_QUALITY_PRESETS.maximum.fps} FPS</span>
                <span>•</span>
                <span>{ANALYSIS_QUALITY_PRESETS.maximum.maxDurationSec}s max</span>
                <span>•</span>
                <span>{t('settings.analysis.maximum.model')}</span>
              </div>
            </button>
          </div>
        </section>

        {/* Music defaults */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-foreground">
            {t('settings.music.title')}
          </h2>

          {musicSettings && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  {t('settings.music.defaultVolume')}:{' '}
                  {Math.round(musicSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicSettings.volume * 100}
                  onChange={(e) =>
                    handleMusicSettingsChange('volume', parseInt(e.target.value) / 100)
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}
        </section>

        {/* Video Storage */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-foreground">
            {t('settings.storage.title')}
          </h2>

          <div className="space-y-4">
            {/* Current usage */}
            {storageInfo && (
              <div className="rounded-lg bg-muted p-3">
                <div className="text-xs text-muted-foreground">
                  {t('settings.storage.currentUsage')}
                </div>
                <div className="font-medium text-foreground">
                  📹 {storageInfo.count} {t('settings.storage.videos')} • {formatBytes(storageInfo.sizeBytes)}
                </div>
              </div>
            )}

            {/* Max videos slider */}
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t('settings.storage.maxVideos')}: {maxVideos}
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={maxVideos}
                onChange={(e) => handleMaxVideosChange(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('settings.storage.maxVideosHelp')}
              </p>
            </div>
          </div>
        </section>

        {/* Data management */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-foreground">
            {t('settings.data.title')}
          </h2>

          <div className="space-y-3">
            {/* Clear history */}
            {showConfirmClear === 'history' ? (
              <div className="rounded-lg bg-red-500/10 p-4">
                <p className="mb-3 text-sm text-red-500">
                  {t('settings.data.confirmClear')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearHistory}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    {t('common.yes')}
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(null)}
                    className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear('history')}
                className="w-full rounded-lg border border-red-500/30 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
              >
                🗑️ {t('settings.data.clearHistory')}
              </button>
            )}

            {/* Clear calibration */}
            {showConfirmClear === 'calibration' ? (
              <div className="rounded-lg bg-red-500/10 p-4">
                <p className="mb-3 text-sm text-red-500">
                  {t('settings.data.confirmClear')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearCalibration}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    {t('common.yes')}
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(null)}
                    className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear('calibration')}
                className="w-full rounded-lg border border-red-500/30 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
              >
                🔄 {t('settings.data.clearCalibration')}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

