'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Combo, CalibrationData, AnalysisResult, SessionData } from '@/lib/types';
import { analyzeVideoBlob, drawSkeleton } from '@/lib/pose/pose';
import { generateScore, getMoveTypesFromCombo } from '@/lib/pose/scoring';
import { MOVES } from '@/lib/combos';
import { createBlobUrl, revokeBlobUrl } from '@/lib/recorder';
import { addToHistory, generateSessionId } from '@/lib/settings';
import { FullscreenToggle } from './FullscreenToggle';
import { ScoreRing } from './ui/ScoreRing';

interface ReviewPhaseProps {
  combo: Combo;
  videoBlob: Blob;
  calibration: CalibrationData | null;
  driveFileId: string | null;
  driveWebViewLink: string | null;
  onTrainAgain: () => void;
  onTryDifferent: () => void;
  onBackToDashboard: () => void;
}

export function ReviewPhase({
  combo,
  videoBlob,
  calibration,
  driveFileId,
  driveWebViewLink,
  onTrainAgain,
  onTryDifferent,
  onBackToDashboard,
}: ReviewPhaseProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Analyze video
  useEffect(() => {
    let currentUrl: string | null = null;
    
    const analyze = async () => {
      try {
        const url = createBlobUrl(videoBlob);
        currentUrl = url;
        setPlaybackUrl(url);

        // Get move types for scoring context
        const moveTypes = getMoveTypesFromCombo(combo.moveIds, MOVES);

        // Analyze video (uses quality settings from user preferences)
        const frames = await analyzeVideoBlob(
          videoBlob,
          (progress) => setAnalysisProgress(progress)
        );

        // Generate scores
        const analysisResult = generateScore(frames, {
          calibration,
          comboMoveTypes: moveTypes,
        });

        setResult(analysisResult);

        // Save to history
        const session: SessionData = {
          id: generateSessionId(),
          comboId: combo.id,
          timestamp: Date.now(),
          score: analysisResult.score,
          driveFileId,
          driveWebViewLink,
        };
        addToHistory(session);
      } catch (err) {
        setError(t('errors.poseModel'));
        console.error('Analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyze();

    return () => {
      if (currentUrl) {
        revokeBlobUrl(currentUrl);
      }
    };
  }, [videoBlob, combo, calibration, driveFileId, driveWebViewLink, t]);

  // Draw skeleton overlay on video
  const drawOverlay = useCallback(() => {
    if (!result || !showSkeleton || !canvasRef.current || !videoRef.current)
      return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas to video dimensions
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find frame closest to current video time
    const currentTime = video.currentTime * 1000;
    let closestFrame = result.frames[0];
    let closestDiff = Math.abs(closestFrame?.timestamp - currentTime);

    for (const frame of result.frames) {
      const diff = Math.abs(frame.timestamp - currentTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestFrame = frame;
      }
    }

    if (closestFrame?.landmarks) {
      drawSkeleton(
        ctx,
        closestFrame.landmarks,
        canvas.width,
        canvas.height,
        '#00ff00'
      );
    }
  }, [result, showSkeleton]);

  // Update overlay on video events (timeupdate, pause, seeked, loadeddata)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEvent = () => {
      drawOverlay();
    };

    // Listen to multiple events to ensure skeleton is drawn when paused too
    video.addEventListener('timeupdate', handleVideoEvent);
    video.addEventListener('pause', handleVideoEvent);
    video.addEventListener('seeked', handleVideoEvent);
    video.addEventListener('loadeddata', handleVideoEvent);
    video.addEventListener('play', handleVideoEvent);

    return () => {
      video.removeEventListener('timeupdate', handleVideoEvent);
      video.removeEventListener('pause', handleVideoEvent);
      video.removeEventListener('seeked', handleVideoEvent);
      video.removeEventListener('loadeddata', handleVideoEvent);
      video.removeEventListener('play', handleVideoEvent);
    };
  }, [drawOverlay]);

  // Draw overlay when showSkeleton is toggled or result changes
  useEffect(() => {
    if (result && showSkeleton) {
      // Small delay to ensure canvas is ready
      requestAnimationFrame(() => {
        drawOverlay();
      });
    }
  }, [showSkeleton, result, drawOverlay]);

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-6 text-6xl">🔍</div>
        <h2 className="mb-4 font-display text-2xl text-foreground">
          {t('session.review.analyzing')}
        </h2>
        <div className="w-64">
          <div className="mb-2 text-center text-sm text-muted-foreground">
            {analysisProgress}%
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-4xl">❌</div>
        <p className="text-muted-foreground">{error || t('errors.generic')}</p>
        <button
          onClick={onBackToDashboard}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('session.review.actions.backToDashboard')}
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            {t('session.review.title')}
          </h2>
          <p className="text-muted-foreground">{t(combo.nameKey)}</p>
        </div>
        <FullscreenToggle targetRef={containerRef} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video with skeleton overlay */}
        <div className="lg:col-span-2">
          <div className="video-container relative">
            <video
              ref={videoRef}
              src={playbackUrl || undefined}
              className="h-full w-full object-cover"
              controls
              playsInline
            />
            {showSkeleton && (
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0"
              />
            )}
          </div>

          {/* Skeleton toggle */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                showSkeleton
                  ? 'bg-green-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {showSkeleton
                ? `🦴 ${t('session.review.overlay.hide')}`
                : `🦴 ${t('session.review.overlay.show')}`}
            </button>
          </div>
        </div>

        {/* Scores */}
        <div className="space-y-4">
          {/* Overall score */}
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <h3 className="mb-4 font-medium text-foreground">
              {t('session.review.score.title')}
            </h3>
            <ScoreRing
              score={result.score.overall}
              maxScore={100}
              label="/ 100"
              size="lg"
            />
          </div>

          {/* Subscores */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-4">
              <ScoreRing
                score={result.score.guard}
                maxScore={25}
                label={t('session.review.score.guard')}
                size="sm"
              />
              <ScoreRing
                score={result.score.stability}
                maxScore={20}
                label={t('session.review.score.stability')}
                size="sm"
              />
              <ScoreRing
                score={result.score.execution}
                maxScore={40}
                label={t('session.review.score.execution')}
                size="sm"
              />
              <ScoreRing
                score={result.score.timing}
                maxScore={15}
                label={t('session.review.score.timing')}
                size="sm"
              />
            </div>
          </div>

          {/* Feedback */}
          <div className="rounded-xl border border-border bg-card p-4">
            {/* Strengths */}
            {result.score.strengths.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-green-600 dark:text-green-400">
                  ✓ {t('session.review.feedback.strengths')}
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.score.strengths.map((key) => (
                    <li key={key}>• {t(key)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {result.score.improvements.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  ↑ {t('session.review.feedback.improvements')}
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.score.improvements.map((key) => (
                    <li key={key}>• {t(key)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {result.score.warnings.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  ℹ {t('session.review.feedback.warnings')}
                </h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {result.score.warnings.map((key) => (
                    <li key={key}>• {t(key)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Google Drive link */}
          {driveWebViewLink && (
            <a
              href={driveWebViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-border bg-card p-3 text-center text-sm text-blue-600 hover:bg-muted dark:text-blue-400"
            >
              📁 View recording in Google Drive →
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3 pt-4">
        <button
          onClick={onTrainAgain}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          🔄 {t('session.review.actions.trainAgain')}
        </button>
        <button
          onClick={onTryDifferent}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          🥊 {t('session.review.actions.tryDifferent')}
        </button>
        <button
          onClick={onBackToDashboard}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {t('session.review.actions.backToDashboard')}
        </button>
      </div>
    </div>
  );
}

