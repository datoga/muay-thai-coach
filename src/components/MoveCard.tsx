'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Move, CalibrationData } from '@/lib/types';
import { StickAvatar, AnimatedStickAvatar } from './StickAvatar';
import { getCalibration } from '@/lib/settings';

interface MoveCardProps {
  move: Move;
}

const MAX_CYCLES = 5;

export function MoveCard({ move }: MoveCardProps) {
  const t = useTranslations();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const hasLoadedCalibration = useRef(false);
  const lastProgressRef = useRef(0);

  // Load calibration on first interaction
  const loadCalibration = useCallback(() => {
    if (!hasLoadedCalibration.current) {
      setCalibration(getCalibration());
      hasLoadedCalibration.current = true;
    }
  }, []);

  const handlePlay = () => {
    loadCalibration();
    setCycleCount(0);
    lastProgressRef.current = 0;
    setIsPlaying(true);
  };

  // Track progress to count cycles
  const handleProgressUpdate = useCallback((progress: number) => {
    // Detect cycle completion (progress wraps from ~1 back to ~0)
    if (lastProgressRef.current > 0.9 && progress < 0.1) {
      setCycleCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= MAX_CYCLES) {
          setIsPlaying(false);
        }
        return newCount;
      });
    }
    lastProgressRef.current = progress;
  }, []);

  // Reset progress tracking when animation stops
  useEffect(() => {
    if (!isPlaying) {
      lastProgressRef.current = 0;
    }
  }, [isPlaying]);

  // Get move type icon and color
  const getMoveTypeInfo = (type: Move['type']) => {
    switch (type) {
      case 'punch':
        return { icon: '👊', color: 'bg-red-500/20 text-red-600 dark:text-red-400', label: t('moves.types.punch') };
      case 'kick':
        return { icon: '🦵', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400', label: t('moves.types.kick') };
      case 'knee':
        return { icon: '🦿', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400', label: t('moves.types.knee') };
      case 'elbow':
        return { icon: '💪', color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400', label: t('moves.types.elbow') };
      case 'defensive':
        return { icon: '🛡️', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', label: t('moves.types.defensive') };
      default:
        return { icon: '🥊', color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400', label: type };
    }
  };

  const getSideInfo = (side: Move['side']) => {
    const stance = calibration?.stance || 'orthodox';
    // For orthodox: lead = left, rear = right
    // For southpaw: lead = right, rear = left
    if (stance === 'orthodox') {
      return side === 'lead' 
        ? { label: t('common.left'), emoji: '🤛', color: 'text-blue-500' }
        : { label: t('common.right'), emoji: '🤜', color: 'text-orange-500' };
    } else {
      return side === 'lead' 
        ? { label: t('common.right'), emoji: '🤜', color: 'text-orange-500' }
        : { label: t('common.left'), emoji: '🤛', color: 'text-blue-500' };
    }
  };

  const typeInfo = getMoveTypeInfo(move.type);
  const sideInfo = getSideInfo(move.side);
  const animationDuration = move.duration * 2; // Slow down for learning

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg">
      {/* Avatar area */}
      <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50">
        {/* Static preview showing peak of movement */}
        {!isPlaying && (
          <StickAvatar
            keyframes={move.keyframes}
            progress={0.45}
            stance={calibration?.stance || 'orthodox'}
            wearingGloves={calibration?.wearingGloves || false}
          />
        )}

        {/* Animated avatar when playing */}
        {isPlaying && (
          <AnimatedStickAvatar
            keyframes={move.keyframes}
            durationMs={animationDuration}
            isPlaying={isPlaying}
            loop={true}
            stance={calibration?.stance || 'orthodox'}
            wearingGloves={calibration?.wearingGloves || false}
            onProgressUpdate={handleProgressUpdate}
          />
        )}

        {/* Play button overlay - only on hover */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
            <button
              onClick={handlePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-110"
            >
              <svg className="h-8 w-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {/* Type badge */}
        <div className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-sm font-medium ${typeInfo.color}`}>
          {typeInfo.icon} {typeInfo.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Move name */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg tracking-wide text-foreground">
            {t(move.nameKey)}
          </h3>
          <span className={`text-sm font-medium ${sideInfo.color}`}>
            {sideInfo.emoji} {sideInfo.label}
          </span>
        </div>

        {/* Description / Cues */}
        <div className="space-y-1">
          {move.cueKeys.slice(0, 2).map((cueKey, index) => (
            <p key={cueKey} className="text-sm text-muted-foreground">
              {index + 1}. {t(cueKey)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

