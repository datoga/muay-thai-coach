'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { CalibrationData, ViewAngle, Stance, FramingQuality } from '@/lib/types';
import { initPoseLandmarker, detectPose, drawSkeleton } from '@/lib/pose/pose';
import {
  getShoulderWidth,
  checkFramingQuality,
  estimateViewAngle,
} from '@/lib/pose/metrics';
import { requestCameraStream, stopStream } from '@/lib/recorder';
import { saveCalibration } from '@/lib/settings';

interface CalibrationPhaseProps {
  onComplete: (calibration: CalibrationData) => void;
  existingCalibration?: CalibrationData | null;
}

type CalibrationStep = 'detecting' | 'holding' | 'confirm';

export function CalibrationPhase({
  onComplete,
  existingCalibration,
}: CalibrationPhaseProps) {
  const t = useTranslations('session.calibration');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const [step, setStep] = useState<CalibrationStep>('detecting');
  const [holdProgress, setHoldProgress] = useState(0);
  const [detectedViewAngle, setDetectedViewAngle] = useState<ViewAngle>('front');
  const [detectedFraming, setDetectedFraming] = useState<FramingQuality | null>(null);
  const [baselineScale, setBaselineScale] = useState(0);
  const [baselineGuardHeight, setBaselineGuardHeight] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User selections
  const [stance, setStance] = useState<Stance>(
    existingCalibration?.stance || 'orthodox'
  );
  const [viewAngle, setViewAngle] = useState<ViewAngle>(
    existingCalibration?.viewAngle || 'front'
  );
  const [wearingGloves, setWearingGloves] = useState(
    existingCalibration?.wearingGloves || false
  );

  // Stability tracking
  const stabilityBufferRef = useRef<number[]>([]);
  const holdStartTimeRef = useRef<number | null>(null);

  const HOLD_DURATION = 3000; // 3 seconds
  const STABILITY_THRESHOLD = 0.02;

  // Initialize camera and pose model
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Initialize pose model
        await initPoseLandmarker();
        if (!mounted) return;
        setIsModelLoading(false);

        // Get camera stream
        const stream = await requestCameraStream({ video: true, audio: false });
        if (!mounted) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to initialize camera'
          );
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        stopStream(streamRef.current);
      }
    };
  }, []);

  // Process frames for pose detection
  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear and draw video
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Detect pose
    const landmarks = await detectPose(video, performance.now());

    if (landmarks) {
      // Draw skeleton
      drawSkeleton(ctx, landmarks, canvas.width, canvas.height, '#00ff00');

      // Check framing quality
      const framing = checkFramingQuality(landmarks);
      setDetectedFraming(framing);

      // Estimate view angle
      const angle = estimateViewAngle(landmarks);
      setDetectedViewAngle(angle);

      // Get baseline measurements
      const shoulderWidth = getShoulderWidth(landmarks);

      // Calculate stability
      stabilityBufferRef.current.push(shoulderWidth);
      if (stabilityBufferRef.current.length > 30) {
        stabilityBufferRef.current.shift();
      }

      if (stabilityBufferRef.current.length >= 10) {
        const avg =
          stabilityBufferRef.current.reduce((a, b) => a + b, 0) /
          stabilityBufferRef.current.length;
        const variance =
          stabilityBufferRef.current.reduce(
            (sum, v) => sum + Math.pow(v - avg, 2),
            0
          ) / stabilityBufferRef.current.length;

        const isStable = variance < STABILITY_THRESHOLD;

        if (isStable && step === 'detecting') {
          setStep('holding');
          holdStartTimeRef.current = performance.now();
        } else if (isStable && step === 'holding') {
          const elapsed = performance.now() - (holdStartTimeRef.current || 0);
          setHoldProgress(Math.min(100, (elapsed / HOLD_DURATION) * 100));

          if (elapsed >= HOLD_DURATION) {
            // Calibration captured
            setBaselineScale(avg);
            // Calculate guard height (simplified)
            const noseY = landmarks[0].y;
            const leftWristY = landmarks[15].y;
            const rightWristY = landmarks[16].y;
            const avgWristY = (leftWristY + rightWristY) / 2;
            setBaselineGuardHeight(noseY - avgWristY);
            setViewAngle(angle);
            setStep('confirm');
          }
        } else if (!isStable && step === 'holding') {
          setStep('detecting');
          setHoldProgress(0);
          holdStartTimeRef.current = null;
        }
      }
    }

    if (step !== 'confirm') {
      animationRef.current = requestAnimationFrame(processFrame);
    }
  }, [step]);

  // Start processing when model is ready
  useEffect(() => {
    if (!isModelLoading && !error && step !== 'confirm') {
      animationRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isModelLoading, error, step, processFrame]);

  const handleConfirm = () => {
    const calibration: CalibrationData = {
      version: 1,
      timestamp: Date.now(),
      viewAngle,
      stance,
      wearingGloves,
      baselineScale,
      baselineGuardHeight,
      framingQuality: detectedFraming || {
        headVisible: true,
        hipsVisible: true,
        anklesVisible: false,
        overallScore: 80,
      },
    };

    saveCalibration(calibration);
    onComplete(calibration);
  };

  const handleRecalibrate = () => {
    setStep('detecting');
    setHoldProgress(0);
    holdStartTimeRef.current = null;
    stabilityBufferRef.current = [];
    animationRef.current = requestAnimationFrame(processFrame);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-4xl">📷</div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Camera Error
        </h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          {t('title')}
        </h2>
        <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Video/Canvas container */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />

        {/* Loading overlay */}
        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="spinner mx-auto mb-3 h-8 w-8 border-white/30 border-t-white" />
              <p>{t('detecting')}</p>
            </div>
          </div>
        )}

        {/* Status overlay */}
        {!isModelLoading && step !== 'confirm' && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-lg bg-black/70 p-3 text-center text-white backdrop-blur-sm">
              {step === 'detecting' && <p>{t('detecting')}</p>}
              {step === 'holding' && (
                <div>
                  <p className="mb-2">{t('holdStill')}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${holdProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Framing feedback */}
        {detectedFraming && step !== 'confirm' && (
          <div className="absolute right-4 top-4 rounded-lg bg-black/70 p-2 text-sm text-white backdrop-blur-sm">
            {detectedFraming.overallScore >= 80 ? (
              <span className="text-green-400">✓ {t('framing.good')}</span>
            ) : detectedFraming.overallScore >= 50 ? (
              <span className="text-yellow-400">⚠ {t('framing.partial')}</span>
            ) : (
              <span className="text-red-400">✕ {t('framing.poor')}</span>
            )}
          </div>
        )}
      </div>

      {/* Confirmation form */}
      {step === 'confirm' && (
        <div className="animate-fade-in space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="text-center">
            <div className="mb-2 text-3xl">✅</div>
            <p className="font-semibold text-foreground">{t('complete')}</p>
          </div>

          {/* Stance selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t('stance.title')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStance('orthodox')}
                className={`rounded-lg border-2 p-3 text-sm transition-colors ${
                  stance === 'orthodox'
                    ? 'border-primary-500 bg-primary-500/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary-500/50'
                }`}
              >
                {t('stance.orthodox')}
              </button>
              <button
                onClick={() => setStance('southpaw')}
                className={`rounded-lg border-2 p-3 text-sm transition-colors ${
                  stance === 'southpaw'
                    ? 'border-primary-500 bg-primary-500/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary-500/50'
                }`}
              >
                {t('stance.southpaw')}
              </button>
            </div>
          </div>

          {/* View angle display */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t('viewAngle.title')}
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
              <span className="text-lg">
                {viewAngle === 'front'
                  ? '👤'
                  : viewAngle === 'three-quarter'
                  ? '👥'
                  : '🚶'}
              </span>
              <span className="text-foreground">
                {viewAngle === 'front'
                  ? t('viewAngle.front')
                  : viewAngle === 'three-quarter'
                  ? t('viewAngle.threeQuarter')
                  : t('viewAngle.side')}
              </span>
            </div>
          </div>

          {/* Gloves toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t('gloves.title')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWearingGloves(true)}
                className={`rounded-lg border-2 p-3 text-sm transition-colors ${
                  wearingGloves
                    ? 'border-primary-500 bg-primary-500/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary-500/50'
                }`}
              >
                🥊 {t('gloves.yes')}
              </button>
              <button
                onClick={() => setWearingGloves(false)}
                className={`rounded-lg border-2 p-3 text-sm transition-colors ${
                  !wearingGloves
                    ? 'border-primary-500 bg-primary-500/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary-500/50'
                }`}
              >
                ✊ {t('gloves.no')}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRecalibrate}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t('recalibrate')}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t('confirm')}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {step !== 'confirm' && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-medium text-foreground">Instructions</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                1
              </span>
              {t('instructions.step1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                2
              </span>
              {t('instructions.step2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                3
              </span>
              {t('instructions.step3')}
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

