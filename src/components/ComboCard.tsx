'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import type { Combo } from '@/lib/types';
import { getComboMoves } from '@/lib/combos';
import { getRoundDuration } from '@/lib/settings';

// Default durations by level (in seconds)
const DEFAULT_DURATIONS: Record<1 | 2 | 3, number> = {
  1: 60,  // 1 min for beginner
  2: 120, // 2 min for intermediate
  3: 180, // 3 min for advanced
};

interface ComboCardProps {
  combo: Combo;
  onSelect: () => void;
}

export function ComboCard({ combo, onSelect }: ComboCardProps) {
  const t = useTranslations();
  const moves = getComboMoves(combo);
  const [roundDuration, setRoundDuration] = useState(DEFAULT_DURATIONS[combo.level]);

  useEffect(() => {
    const duration = getRoundDuration(combo.level);
    if (duration && !isNaN(duration)) {
      setRoundDuration(duration);
    }
  }, [combo.level]);

  const levelColors = {
    1: 'border-green-500/30 bg-green-500/5',
    2: 'border-yellow-500/30 bg-yellow-500/5',
    3: 'border-red-500/30 bg-red-500/5',
  };

  const levelBadgeColors = {
    1: 'bg-green-500/20 text-green-600 dark:text-green-400',
    2: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    3: 'bg-red-500/20 text-red-600 dark:text-red-400',
  };

  return (
    <button
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-xl border-2 p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${levelColors[combo.level]}`}
    >
      {/* Level badge */}
      <div
        className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${levelBadgeColors[combo.level]}`}
      >
        L{combo.level}
      </div>

      {/* Combo name */}
      <h3 className="mb-3 font-display text-xl tracking-wide text-foreground">
        {t(combo.nameKey)}
      </h3>

      {/* Moves list */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {moves.map((move, index) => (
          <span
            key={`${move.id}-${index}`}
            className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
          >
            {t(move.nameKey)}
          </span>
        ))}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          {roundDuration >= 60 
            ? `${Math.floor(roundDuration / 60)}:${(roundDuration % 60).toString().padStart(2, '0')}`
            : `${roundDuration}s`
          }
        </span>
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
        <svg
          className="h-6 w-6 text-primary-500"
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
      </div>
    </button>
  );
}

