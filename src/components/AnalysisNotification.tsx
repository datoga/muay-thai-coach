'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getHistory } from '@/lib/settings';
import { getComboById } from '@/lib/combos';
import type { SessionData, Combo } from '@/lib/types';
import { SessionDetailModal } from './SessionDetailModal';

interface AnalysisNotificationProps {
  // Optional callback when a notification is shown
  onNotificationShown?: () => void;
}

/**
 * Component that monitors for completed analyses and shows notifications
 */
export function AnalysisNotification({ onNotificationShown }: AnalysisNotificationProps) {
  const t = useTranslations();
  const [notification, setNotification] = useState<{
    session: SessionData;
    combo: Combo;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [checkedSessionIds, setCheckedSessionIds] = useState<Set<string>>(new Set());

  // Check for completed analyses periodically
  const checkForCompletedAnalyses = useCallback(() => {
    const history = getHistory();
    
    // Find sessions that just completed analysis (had isAnalyzing=true, now have score)
    for (const session of history) {
      // Skip if we've already shown notification for this session
      if (checkedSessionIds.has(session.id)) continue;
      
      // If session has a score and was recently analyzed (within last 30 seconds)
      if (session.score && !session.isAnalyzing) {
        const ageMs = Date.now() - session.timestamp;
        // Only show notification for recent sessions (within 5 minutes)
        if (ageMs < 5 * 60 * 1000) {
          const combo = getComboById(session.comboId);
          if (combo) {
            setNotification({ session, combo });
            setCheckedSessionIds(prev => new Set([...prev, session.id]));
            onNotificationShown?.();
            break;
          }
        }
      }
      
      // Mark sessions as checked to avoid repeated checks
      if (!session.isAnalyzing) {
        setCheckedSessionIds(prev => new Set([...prev, session.id]));
      }
    }
  }, [checkedSessionIds, onNotificationShown]);

  // Poll for completed analyses
  useEffect(() => {
    // Initial check
    checkForCompletedAnalyses();
    
    // Check every 3 seconds
    const interval = setInterval(checkForCompletedAnalyses, 3000);
    
    return () => clearInterval(interval);
  }, [checkForCompletedAnalyses]);

  // Dismiss notification
  const handleDismiss = () => {
    setNotification(null);
  };

  // Open modal with full details
  const handleViewDetails = () => {
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setNotification(null);
  };

  if (!notification) return null;

  return (
    <>
      {/* Floating notification toast - hidden when modal is open */}
      {!showModal && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg max-w-sm">
            {/* Success icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground">
                {t('notifications.analysisComplete')}
              </h4>
              <p className="text-sm text-muted-foreground truncate">
                {t(notification.combo.nameKey)}
              </p>
              {notification.session.score && (
                <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                  {t('notifications.score')}: {notification.session.score.overall}/100
                </p>
              )}
              
              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleViewDetails}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  {t('notifications.viewDetails')}
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  {t('notifications.dismiss')}
                </button>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {showModal && (
        <SessionDetailModal
          session={notification.session}
          combo={notification.combo}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

