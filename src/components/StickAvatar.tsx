'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { AvatarKeyframe, Stance } from '@/lib/types';
import {
  getPoseAtProgress,
  poseToCanvas,
  drawStickman,
  mirrorPose,
} from '@/lib/stickAvatarKeyframes';

interface StickAvatarProps {
  keyframes: AvatarKeyframe[];
  progress: number; // 0-1
  stance?: Stance;
  wearingGloves?: boolean;
  className?: string;
}

export function StickAvatar({
  keyframes,
  progress,
  stance = 'orthodox',
  wearingGloves = false,
  className = '',
}: StickAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set canvas size accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get pose at current progress
    let pose = getPoseAtProgress(keyframes, progress);

    // Mirror for orthodox - the avatar acts as a mirror, so:
    // - Orthodox users (left forward IRL) see their left on the RIGHT in mirror → avatar shows right forward
    // - Southpaw users (right forward IRL) see their right on the LEFT in mirror → avatar shows left forward (base pose)
    if (stance === 'orthodox') {
      pose = mirrorPose(pose);
    }

    // Convert to canvas coordinates
    const canvasPose = poseToCanvas(pose, rect.width, rect.height, 0.35);

    // Draw stickman
    drawStickman(ctx, canvasPose, {
      lineColor: '#ef4444',
      jointColor: '#fde047',
      headColor: '#fde047',
      lineWidth: 3,
      jointRadius: 5,
      headRadius: 15,
      gloves: wearingGloves,
      gloveColor: '#dc2626',
    });
  }, [keyframes, progress, stance, wearingGloves]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => {
      draw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}

// Animated version that plays through keyframes
interface AnimatedStickAvatarProps {
  keyframes: AvatarKeyframe[];
  durationMs: number;
  isPlaying: boolean;
  loop?: boolean;
  stance?: Stance;
  wearingGloves?: boolean;
  className?: string;
  onComplete?: () => void;
  onProgressUpdate?: (progress: number) => void;
}

export function AnimatedStickAvatar({
  keyframes,
  durationMs,
  isPlaying,
  loop = true,
  stance = 'orthodox',
  wearingGloves = false,
  className = '',
  onComplete,
  onProgressUpdate,
}: AnimatedStickAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Store callbacks in refs to avoid restarting animation when they change
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      let progress = elapsed / durationMs;

      if (progress >= 1) {
        if (loop) {
          startTimeRef.current = timestamp;
          progress = 0;
        } else {
          progress = 1;
          onProgressUpdateRef.current?.(progress);
          onCompleteRef.current?.();
          return;
        }
      }

      // Report progress for syncing with other components
      onProgressUpdateRef.current?.(progress);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, rect.width, rect.height);

      let pose = getPoseAtProgress(keyframes, progress);

      // Mirror for orthodox (see comment in StaticStickAvatar)
      if (stance === 'orthodox') {
        pose = mirrorPose(pose);
      }

      const canvasPose = poseToCanvas(pose, rect.width, rect.height, 0.35);

      drawStickman(ctx, canvasPose, {
        lineColor: '#ef4444',
        jointColor: '#fde047',
        headColor: '#fde047',
        lineWidth: 3,
        jointRadius: 5,
        headRadius: 15,
        gloves: wearingGloves,
        gloveColor: '#dc2626',
      });

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    },
    [keyframes, durationMs, loop, stance, wearingGloves, isPlaying] // Removed callback dependencies
  );

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}

