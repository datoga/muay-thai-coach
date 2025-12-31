'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { SessionData, Combo } from '@/lib/types';
import { COMBOS, getCombosByLevel, getComboById } from '@/lib/combos';
import { getHistory, deleteSession } from '@/lib/settings';
import { deleteVideo } from '@/lib/videoStorage';
import { LevelSelector } from '@/components/LevelSelector';
import { ComboCard } from '@/components/ComboCard';
import { SessionDetailModal } from '@/components/SessionDetailModal';

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();

  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);
  const [history, setHistory] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<{ session: SessionData; combo: Combo } | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const filteredCombos = selectedLevel
    ? getCombosByLevel(selectedLevel)
    : COMBOS;

  const handleComboSelect = (comboId: string) => {
    router.push(`/session/${comboId}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    // Also delete local video if exists
    deleteVideo(sessionId).catch(() => {
      // Ignore errors - video may not exist
    });
    setHistory(getHistory());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Combos Section */}
      <div className="mb-12">
        {/* Section header */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 font-display text-2xl tracking-wide text-foreground">
            {t('dashboard.combos.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('dashboard.combos.subtitle')}
          </p>
        </div>

        {/* Level selector */}
        <div className="mb-6">
          <LevelSelector selectedLevel={selectedLevel} onSelect={setSelectedLevel} />
          {selectedLevel && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setSelectedLevel(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('dashboard.showAllLevels')}
              </button>
            </div>
          )}
        </div>

        {/* Combos grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCombos.map((combo) => (
            <ComboCard
              key={combo.id}
              combo={combo}
              onSelect={() => handleComboSelect(combo.id)}
            />
          ))}
        </div>
      </div>

      {/* Training history */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-xl tracking-wide text-foreground">
          {t('dashboard.history.title')}
        </h2>

        {history.length === 0 ? (
          <p className="text-center text-muted-foreground">
            {t('dashboard.history.empty')}
          </p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 10).map((session) => {
              const combo = getComboById(session.comboId);
              if (!combo) return null;

              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession({ session, combo })}
                  className="flex items-center justify-between rounded-lg bg-muted p-4 cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {t(combo.nameKey)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(session.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Analyzing indicator */}
                    {session.isAnalyzing && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5">
                        <svg className="h-4 w-4 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          {t('dashboard.history.analyzing')}
                        </span>
                      </div>
                    )}
                    
                    {/* Score display */}
                    {session.score && !session.isAnalyzing && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {t('dashboard.history.score')}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            session.score.overall >= 80
                              ? 'text-green-500'
                              : session.score.overall >= 60
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}
                        >
                          {session.score.overall}
                        </div>
                      </div>
                    )}
                    
                    {/* No score and not analyzing */}
                    {!session.score && !session.isAnalyzing && (
                      <div className="text-sm text-muted-foreground">
                        {t('dashboard.history.noScore')}
                      </div>
                    )}
                    {session.driveWebViewLink && (
                      <a
                        href={session.driveWebViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                      >
                        📁 {t('dashboard.history.viewDrive')}
                      </a>
                    )}
                    {/* Local video indicator (when no Drive link) */}
                    {!session.driveWebViewLink && session.hasLocalVideo && (
                      <span className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                        💾 {t('dashboard.history.localVideo')}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                      title={t('dashboard.history.delete')}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session detail modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession.session}
          combo={selectedSession.combo}
          onClose={() => {
            setSelectedSession(null);
            // Refresh history in case analysis completed
            setHistory(getHistory());
          }}
        />
      )}
    </div>
  );
}

