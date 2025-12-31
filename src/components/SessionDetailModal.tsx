'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { SessionData, Combo, ExtendedSession } from '@/lib/types';
import { getHistory, updateSession } from '@/lib/settings';
import { uploadVideoToDrive } from '@/lib/drive';
import { ScoreRing } from './ui/ScoreRing';
import { createVideoUrl, getVideo } from '@/lib/videoStorage';

interface SessionDetailModalProps {
  session: SessionData;
  combo: Combo;
  onClose: () => void;
}

export function SessionDetailModal({ session: initialSession, combo, onClose }: SessionDetailModalProps) {
  const t = useTranslations();
  const { data: authSession } = useSession() as { data: ExtendedSession | null };
  const [session, setSession] = useState(initialSession);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Poll for updates while analyzing
  useEffect(() => {
    if (!session.isAnalyzing) return;

    const interval = setInterval(() => {
      const history = getHistory();
      const updatedSession = history.find(s => s.id === session.id);
      if (updatedSession) {
        setSession(updatedSession);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.id, session.isAnalyzing]);

  // Load local video if available (even if Drive exists, as backup)
  useEffect(() => {
    if (!session.hasLocalVideo) return;

    setIsLoadingVideo(true);
    createVideoUrl(session.id)
      .then(url => {
        setLocalVideoUrl(url);
      })
      .catch(err => {
        console.error('Failed to load local video:', err);
      })
      .finally(() => {
        setIsLoadingVideo(false);
      });

    // Cleanup blob URL on unmount
    return () => {
      if (localVideoUrl) {
        URL.revokeObjectURL(localVideoUrl);
      }
    };
  }, [session.id, session.hasLocalVideo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track video playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !localVideoUrl) return;

    const handlePlay = () => setIsVideoPlaying(true);
    const handlePause = () => setIsVideoPlaying(false);
    const handleEnded = () => {
      setIsVideoPlaying(false);
      setVideoProgress(0);
    };
    const handleTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [localVideoUrl]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle uploading local video to Google Drive
  const handleUploadToDrive = async () => {
    if (!authSession?.accessToken || !session.hasLocalVideo) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Get the video blob from IndexedDB
      const blob = await getVideo(session.id);
      if (!blob) {
        throw new Error('Video not found');
      }

      // Upload to Drive
      const result = await uploadVideoToDrive(
        authSession.accessToken,
        blob,
        combo.id
      );

      // Update session with Drive info
      updateSession(session.id, {
        driveFileId: result.fileId,
        driveWebViewLink: result.webViewLink,
      });

      // Update local state
      setSession(prev => ({
        ...prev,
        driveFileId: result.fileId,
        driveWebViewLink: result.webViewLink,
      }));
    } catch (err) {
      console.error('Upload error:', err);
      if (err instanceof Error && err.message.includes('401')) {
        setUploadError(t('errors.tokenExpired'));
      } else {
        setUploadError(t('errors.driveUpload'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h2 className="font-display text-xl tracking-wide text-foreground">
              {t(combo.nameKey)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(session.timestamp)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Priority 1: Local video (if available) */}
          {localVideoUrl && (
            <div className="rounded-xl overflow-hidden border border-border bg-black">
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  src={localVideoUrl}
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                  style={{ transform: 'scaleX(-1)' }}
                  playsInline
                  onClick={() => {
                    const video = videoRef.current;
                    if (video) {
                      if (video.paused) video.play();
                      else video.pause();
                    }
                  }}
                />
                {/* Custom controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <button
                    onClick={() => {
                      const video = videoRef.current;
                      if (video) {
                        if (video.paused) video.play();
                        else video.pause();
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                  >
                    {isVideoPlaying ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={videoProgress}
                    className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    onChange={(e) => {
                      const video = videoRef.current;
                      if (video && video.duration && isFinite(video.duration)) {
                        video.currentTime = (parseFloat(e.target.value) / 100) * video.duration;
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const video = videoRef.current;
                      if (video) {
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        } else {
                          video.requestFullscreen();
                        }
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {t('dashboard.history.localVideo')}
                </div>
                {/* Upload to Drive button - only show if not already on Drive */}
                {!session.driveFileId && (
                  authSession?.accessToken ? (
                    <button
                      onClick={handleUploadToDrive}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                          {t('session.practice.upload.uploading')}
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.015-1.708-2.996-3.785-6.62L15.74 1.532c-.005-.015-1.679-.047-3.73-.047zm-4.24 6.148c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.015-1.708-2.996-3.785-6.62l-3.766-6.527c-.005-.015-1.679-.047-3.73-.047zM.025 13.62c-.005.015 1.699 3.001 3.786 6.62l3.76 6.574 3.76-.015c2.07-.01 3.753-.037 3.742-.062-.005-.015-1.708-2.996-3.785-6.62L7.522 13.59c-.005-.015-3.37-.015-7.497.03z"/>
                          </svg>
                          {t('session.practice.actions.uploadDrive')}
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('session.practice.upload.signInRequired')}
                    </span>
                  )
                )}
              </div>
              {/* Upload error */}
              {uploadError && (
                <div className="px-4 py-2 text-xs text-red-500 bg-red-500/10">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* Priority 2: Google Drive (if no local video) */}
          {!localVideoUrl && !isLoadingVideo && session.driveFileId && (
            <div className="rounded-xl overflow-hidden border border-border bg-black">
              <div className="relative aspect-video">
                <iframe
                  src={`https://drive.google.com/file/d/${session.driveFileId}/preview`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Loading video */}
          {isLoadingVideo && (
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
              <div className="h-6 w-6 mx-auto mb-2 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          )}

          {/* No video message */}
          {!localVideoUrl && !isLoadingVideo && !session.driveFileId && (
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.history.noVideo')}
              </p>
            </div>
          )}

          {/* Analyzing state with progress */}
          {session.isAnalyzing && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
                <p className="font-medium text-foreground">{t('dashboard.history.analyzing')}</p>
                <span className="ml-auto text-sm font-medium text-primary-500">
                  {session.analysisProgress ?? 0}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div 
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${session.analysisProgress ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {/* No score */}
          {!session.score && !session.isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <p className="text-sm text-muted-foreground">{t('dashboard.history.noScore')}</p>
            </div>
          )}

          {/* Score display */}
          {session.score && (
            <>
              {/* Overall score */}
              <div className="flex justify-center">
                <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
                  <h3 className="mb-4 font-medium text-foreground">
                    {t('session.review.score.title')}
                  </h3>
                  <ScoreRing
                    score={session.score.overall}
                    maxScore={100}
                    label="/ 100"
                    size="lg"
                  />
                </div>
              </div>

              {/* Subscores */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid grid-cols-4 gap-4">
                  <ScoreRing
                    score={session.score.guard}
                    maxScore={25}
                    label={t('session.review.score.guard')}
                    size="sm"
                  />
                  <ScoreRing
                    score={session.score.stability}
                    maxScore={20}
                    label={t('session.review.score.stability')}
                    size="sm"
                  />
                  <ScoreRing
                    score={session.score.execution}
                    maxScore={40}
                    label={t('session.review.score.execution')}
                    size="sm"
                  />
                  <ScoreRing
                    score={session.score.timing}
                    maxScore={15}
                    label={t('session.review.score.timing')}
                    size="sm"
                  />
                </div>
              </div>

              {/* Feedback */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                {/* Strengths */}
                {session.score.strengths.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-green-600 dark:text-green-400">
                      ✓ {t('session.review.feedback.strengths')}
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {session.score.strengths.map((key) => (
                        <li key={key}>• {t(key)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {session.score.improvements.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      ↑ {t('session.review.feedback.improvements')}
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {session.score.improvements.map((key) => (
                        <li key={key}>• {t(key)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {session.score.warnings.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      ℹ {t('session.review.feedback.warnings')}
                    </h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {session.score.warnings.map((key) => (
                        <li key={key}>• {t(key)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* No feedback */}
                {session.score.strengths.length === 0 && 
                 session.score.improvements.length === 0 && 
                 session.score.warnings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t('session.review.feedback.none')}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Open in Drive link */}
          {session.driveWebViewLink && (
            <a
              href={session.driveWebViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.015-1.708-2.996-3.785-6.62L15.74 1.532c-.005-.015-1.679-.047-3.73-.047zm-4.24 6.148c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.015-1.708-2.996-3.785-6.62l-3.766-6.527c-.005-.015-1.679-.047-3.73-.047zM.025 13.62c-.005.015 1.699 3.001 3.786 6.62l3.76 6.574 3.76-.015c2.07-.01 3.753-.037 3.742-.062-.005-.015-1.708-2.996-3.785-6.62L7.522 13.59c-.005-.015-3.37-.015-7.497.03z"/>
              </svg>
              {t('dashboard.history.openInDrive')}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

