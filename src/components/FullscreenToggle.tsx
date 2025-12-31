'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef } from 'react';

interface FullscreenToggleProps {
  targetRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export function FullscreenToggle({ targetRef, className = '' }: FullscreenToggleProps) {
  const t = useTranslations('session.practice.fullscreen');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const defaultRef = useRef<HTMLElement | null>(null);

  const updateFullscreenState = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
    };
  }, [updateFullscreenState]);

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        const element = targetRef?.current || defaultRef.current || document.documentElement;
        await element.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className={`inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground ${className}`}
    >
      {isFullscreen ? (
        <>
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
              d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
            />
          </svg>
          {t('exit')}
        </>
      ) : (
        <>
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
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
          {t('enter')}
        </>
      )}
    </button>
  );
}

