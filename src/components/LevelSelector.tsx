'use client';

import { useTranslations } from 'next-intl';

interface LevelSelectorProps {
  selectedLevel: 1 | 2 | 3 | null;
  onSelect: (level: 1 | 2 | 3) => void;
}

const levels: Array<{ level: 1 | 2 | 3; color: string; icon: string }> = [
  { level: 1, color: 'from-green-500 to-emerald-600', icon: '🥋' },
  { level: 2, color: 'from-yellow-500 to-amber-600', icon: '🔥' },
  { level: 3, color: 'from-red-500 to-rose-600', icon: '⚡' },
];

export function LevelSelector({ selectedLevel, onSelect }: LevelSelectorProps) {
  const t = useTranslations('dashboard.levels');

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {levels.map(({ level, color, icon }) => (
        <button
          key={level}
          onClick={() => onSelect(level)}
          className={`group relative overflow-hidden rounded-xl px-6 py-4 transition-all duration-300 ${
            selectedLevel === level
              ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-background'
              : 'hover:scale-105'
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${color} opacity-${
              selectedLevel === level ? '100' : '80'
            } transition-opacity group-hover:opacity-100`}
          />
          <div className="relative flex items-center gap-3 text-white">
            <span className="text-2xl">{icon}</span>
            <div className="text-left">
              <div className="text-xs uppercase tracking-wide opacity-80">
                Level {level}
              </div>
              <div className="font-display text-lg tracking-wide">
                {t(String(level))}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

