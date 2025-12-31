'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Combo, CalibrationData, MoveSide, Stance } from '@/lib/types';
import { getComboMoves, getComboTotalDuration } from '@/lib/combos';
import { generateComboKeyframes } from '@/lib/stickAvatarKeyframes';
import { AnimatedStickAvatar } from './StickAvatar';

// Helper to get actual side (left/right) based on stance and move side
function getActualSide(moveSide: MoveSide, stance: Stance): 'left' | 'right' {
  // For orthodox: lead = left, rear = right
  // For southpaw: lead = right, rear = left
  if (stance === 'orthodox') {
    return moveSide === 'lead' ? 'left' : 'right';
  } else {
    return moveSide === 'lead' ? 'right' : 'left';
  }
}

interface LearnPhaseProps {
  combo: Combo;
  calibration: CalibrationData | null;
  onContinue: () => void;
}

export function LearnPhase({ combo, calibration, onContinue }: LearnPhaseProps) {
  const t = useTranslations();
  
  // Memoize these to prevent animation restart on re-render
  const moves = useMemo(() => getComboMoves(combo), [combo]);
  const comboKeyframes = useMemo(
    () => generateComboKeyframes(combo.moveIds, getComboTotalDuration(combo)),
    [combo]
  );
  const animationDuration = useMemo(
    () => moves.length * 1500 + 500, // 1.5s per move + buffer
    [moves.length]
  );

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<'moves' | 'tips'>('moves');
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  const MAX_AUTO_CYCLES = 3;

  // Refs for tracking progress
  const lastProgressRef = useRef(0);
  const cycleCountRef = useRef(0);

  // Auto-play demo on mount
  useEffect(() => {
    if (hasAutoStarted) return;
    
    const timer = setTimeout(() => {
      // Reset before starting (like handlePlay in MoveCard)
      cycleCountRef.current = 0;
      setCurrentMoveIndex(0);
      lastProgressRef.current = 0;
      setIsPlaying(true);
      setHasAutoStarted(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [hasAutoStarted]);

  // Reset progress tracking when animation stops
  useEffect(() => {
    if (!isPlaying) {
      lastProgressRef.current = 0;
    }
  }, [isPlaying]);

  // Handle progress updates from avatar animation (same pattern as MoveCard)
  const handleProgressUpdate = useCallback(
    (progress: number) => {
      if (isTransitioning) return;

      const moveCount = moves.length;
      
      // Simple calculation: divide the animation into equal parts for each move
      // Use 90% of animation for moves (last 10% is return to guard)
      let newMoveIndex: number;
      
      if (progress >= 0.9) {
        // In return-to-guard phase, keep showing last move
        newMoveIndex = moveCount - 1;
      } else {
        // Each move gets an equal slice of the 90%
        newMoveIndex = Math.floor((progress / 0.9) * moveCount);
        // Clamp to valid range
        newMoveIndex = Math.min(newMoveIndex, moveCount - 1);
        newMoveIndex = Math.max(newMoveIndex, 0);
      }

      // Update current move index
      setCurrentMoveIndex(newMoveIndex);

      // Detect cycle completion (progress wraps from ~1 back to ~0)
      if (lastProgressRef.current > 0.9 && progress < 0.1) {
        cycleCountRef.current += 1;
        if (cycleCountRef.current >= MAX_AUTO_CYCLES) {
          setIsPlaying(false);
        }
      }
      
      lastProgressRef.current = progress;
    },
    [isTransitioning, moves.length]
  );

  // Handle continue - stop all activity first
  const handleContinue = useCallback(() => {
    setIsTransitioning(true);
    setIsPlaying(false);
    // Small delay to ensure cleanup
    setTimeout(() => {
      onContinue();
    }, 50);
  }, [onContinue]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          {t('session.learn.title')}
        </h2>
        <p className="mt-1 text-lg font-semibold text-primary-500">
          {t(combo.nameKey)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Avatar demo */}
        <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted to-muted/50">
          <AnimatedStickAvatar
            keyframes={comboKeyframes}
            durationMs={animationDuration}
            isPlaying={isPlaying && !isTransitioning}
            loop={true}
            stance={calibration?.stance || 'orthodox'}
            wearingGloves={calibration?.wearingGloves || false}
            onProgressUpdate={handleProgressUpdate}
          />

          {/* Play/Pause button overlay - visible on hover */}
          <div 
            className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
              isPlaying 
                ? 'bg-black/0 opacity-0 hover:bg-black/30 hover:opacity-100' 
                : 'bg-black/0 opacity-0 group-hover:bg-black/30 group-hover:opacity-100'
            }`}
          >
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-110"
            >
              {isPlaying ? (
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="h-8 w-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* Combo details with tabs */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('moves')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'moves'
                  ? 'bg-primary-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              🥊 {t('session.learn.moves')}
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'tips'
                  ? 'bg-primary-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              💡 {t('session.learn.tips')}
            </button>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {/* Moves list */}
            {activeTab === 'moves' && (
              <div className="space-y-2">
                {moves.map((move, index) => {
                  const stance = calibration?.stance || 'orthodox';
                  const actualSide = getActualSide(move.side, stance);
                  const isLeftSide = actualSide === 'left';
                  
                  return (
                    <div
                      key={`${move.id}-${index}`}
                      className={`rounded-lg p-3 transition-colors ${
                        isPlaying && currentMoveIndex === index
                          ? 'bg-primary-500/20 ring-2 ring-primary-500'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {t(move.nameKey)}
                            </span>
                            {/* Side indicator */}
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                                isLeftSide
                                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                  : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                              }`}
                              title={isLeftSide ? t('session.learn.side.leftFull') : t('session.learn.side.rightFull')}
                            >
                              {isLeftSide ? t('session.learn.side.left') : t('session.learn.side.right')}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {move.type} • {isLeftSide ? '🤛' : '🤜'} {isLeftSide ? t('session.learn.side.leftFull') : t('session.learn.side.rightFull')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tips/Coaching cues */}
            {activeTab === 'tips' && (
              <div className="space-y-4">
                {/* General combo tips */}
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {combo.tipKeys.map((tipKey) => (
                    <li key={tipKey} className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      {t(tipKey)}
                    </li>
                  ))}
                </ul>

                {/* Move-specific cues */}
                {moves.map((move, index) => (
                  <div key={`cues-${move.id}-${index}`} className="border-t border-border pt-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {index + 1}. {t(move.nameKey)}
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {move.cueKeys.slice(0, 2).map((cueKey) => (
                        <li key={cueKey} className="flex items-start gap-2">
                          <span className="text-accent-500">→</span>
                          {t(cueKey)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleContinue}
          disabled={isTransitioning}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {t('session.learn.ready')}
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
