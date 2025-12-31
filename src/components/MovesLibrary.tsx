'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { MOVES } from '@/lib/combos';
import { MoveCard } from './MoveCard';
import type { MoveType } from '@/lib/types';

export function MovesLibrary() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MoveType | 'all'>('all');

  // Convert MOVES object to array
  const movesArray = useMemo(() => Object.values(MOVES), []);

  // Filter moves based on search and type
  const filteredMoves = useMemo(() => {
    return movesArray.filter((move) => {
      // Type filter
      if (selectedType !== 'all' && move.type !== selectedType) {
        return false;
      }

      // Search filter (search in translated name)
      if (searchQuery) {
        const moveName = t(move.nameKey).toLowerCase();
        const query = searchQuery.toLowerCase();
        if (!moveName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [movesArray, searchQuery, selectedType, t]);

  const moveTypes: { value: MoveType | 'all'; icon: string; label: string }[] = [
    { value: 'all', icon: '🥊', label: t('dashboard.moves.filters.all') },
    { value: 'punch', icon: '👊', label: t('moves.types.punch') },
    { value: 'kick', icon: '🦵', label: t('moves.types.kick') },
    { value: 'knee', icon: '🦿', label: t('moves.types.knee') },
    { value: 'elbow', icon: '💪', label: t('moves.types.elbow') },
  ];

  return (
    <div className="mb-12">
      {/* Section header */}
      <div className="mb-6 text-center">
        <h2 className="mb-2 font-display text-2xl tracking-wide text-foreground">
          {t('dashboard.moves.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('dashboard.moves.subtitle')}
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={t('dashboard.moves.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Type filter buttons */}
        <div className="flex flex-wrap gap-2">
          {moveTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                selectedType === type.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <span>{type.icon}</span>
              <span className="hidden sm:inline">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {t('dashboard.moves.showing', { count: filteredMoves.length, total: movesArray.length })}
      </div>

      {/* Moves grid */}
      {filteredMoves.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMoves.map((move) => (
            <MoveCard key={move.id} move={move} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="mb-2 text-4xl">🔍</div>
          <p className="text-muted-foreground">
            {t('dashboard.moves.noResults')}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
            }}
            className="mt-3 text-sm text-primary-500 hover:underline"
          >
            {t('dashboard.moves.clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}

