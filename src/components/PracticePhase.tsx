'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import type { Combo, DriveUploadResult, ExtendedSession, SessionData } from '@/lib/types';
import { VideoRecorder, createBlobUrl, revokeBlobUrl } from '@/lib/recorder';
import { uploadVideoToDrive } from '@/lib/drive';
import { getRoundDuration, getCalibration, addToHistory, updateSession, generateSessionId } from '@/lib/settings';
import { saveVideo } from '@/lib/videoStorage';
import { getComboMoves, MOVES } from '@/lib/combos';
import { analyzeVideoBlob } from '@/lib/pose/pose';
import { generateScore, getMoveTypesFromCombo } from '@/lib/pose/scoring';
import { FullscreenToggle } from './FullscreenToggle';
import { MusicPanel } from './MusicPanel';

interface PracticePhaseProps {
  combo: Combo;
  onBack: () => void;
}

type PracticeState = 'ready' | 'countdown' | 'recording' | 'paused' | 'finishing' | 'complete';

export function PracticePhase({ combo, onBack }: PracticePhaseProps) {
  const t = useTranslations();
  const router = useRouter();
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<VideoRecorder | null>(null);

  const [state, setState] = useState<PracticeState>('ready');
  const [countdown, setCountdown] = useState(3);
  const [roundDuration, setRoundDurationState] = useState(60); // Will be set based on level
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [showComboGuide, setShowComboGuide] = useState(true);
  
  // Playback controls state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  
  // Background analysis state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Get combo moves
  const moves = getComboMoves(combo);
  
  // Rhythm interval - time per move in the combo cycle (2 seconds per move)
  const moveIntervalMs = 2000;

  // Load round duration from settings based on combo level
  useEffect(() => {
    const duration = getRoundDuration(combo.level);
    setRoundDurationState(duration);
    setTimeRemaining(duration);
  }, [combo.level]);

  // Track playback video state
  useEffect(() => {
    const video = playbackVideoRef.current;
    if (!video || state !== 'complete') return;

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
  }, [state]);

  // Pause duration between sequences (in ms)
  const pauseBetweenSequences = 1500;
  
  // Cycle through moves during recording (-1 = pause between sequences)
  useEffect(() => {
    if (state !== 'recording') {
      setCurrentMoveIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        // If we're at the last move, go to pause (-1)
        if (prev === moves.length - 1) {
          return -1; // Pause state
        }
        // If we're in pause, go back to first move
        if (prev === -1) {
          return 0;
        }
        // Otherwise, next move
        return prev + 1;
      });
    }, currentMoveIndex === -1 ? pauseBetweenSequences : moveIntervalMs);

    return () => clearInterval(interval);
  }, [state, moves.length, moveIntervalMs, currentMoveIndex, pauseBetweenSequences]);

  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DriveUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Start background analysis when recording completes
  useEffect(() => {
    if (state !== 'complete' || !recordedBlob || isAnalyzing || sessionId) return;

    // Generate session ID and save to history immediately
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    const session: SessionData = {
      id: newSessionId,
      comboId: combo.id,
      timestamp: Date.now(),
      score: null,
      driveFileId: uploadResult?.fileId || null,
      driveWebViewLink: uploadResult?.webViewLink || null,
      hasLocalVideo: true, // Video will be saved locally
      isAnalyzing: true,
      analysisProgress: 0,
    };
    addToHistory(session);
    
    // Save video to IndexedDB
    saveVideo(newSessionId, recordedBlob).catch(err => {
      console.error('Failed to save video locally:', err);
      // Update session to reflect no local video
      updateSession(newSessionId, { hasLocalVideo: false });
    });
    
    // Start background analysis
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const runAnalysis = async () => {
      try {
        const calibration = getCalibration();
        const moveTypes = getMoveTypesFromCombo(combo.moveIds, MOVES);
        
        // Analyze video - update both local state and session storage
        const frames = await analyzeVideoBlob(
          recordedBlob,
          (progress) => {
            setAnalysisProgress(progress);
            // Update session progress every 5%
            if (progress % 5 === 0 || progress === 100) {
              updateSession(newSessionId, { analysisProgress: progress });
            }
          }
        );

        // Generate scores
        const analysisResult = generateScore(frames, {
          calibration,
          comboMoveTypes: moveTypes,
        });

        // Update session with results
        updateSession(newSessionId, {
          score: analysisResult.score,
          isAnalyzing: false,
          analysisProgress: 100,
        });
      } catch (error) {
        console.error('Background analysis error:', error);
        // Mark as not analyzing even on error
        updateSession(newSessionId, {
          isAnalyzing: false,
          analysisProgress: 0,
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  }, [state, recordedBlob, combo, uploadResult, isAnalyzing, sessionId]);

  // Detect fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize camera
  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      try {
        const recorder = new VideoRecorder();
        const stream = await recorder.initialize();
        
        if (!mounted) {
          recorder.cleanup();
          return;
        }
        
        recorderRef.current = recorder;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setError(null); // Clear any previous error
        }
      } catch {
        if (mounted) {
          setError(t('errors.cameraAccess'));
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (recorderRef.current) {
        recorderRef.current.cleanup();
        recorderRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Cleanup playback URL on unmount
  useEffect(() => {
    return () => {
      if (playbackUrl) {
        revokeBlobUrl(playbackUrl);
      }
    };
  }, [playbackUrl]);

  // Countdown timer
  useEffect(() => {
    if (state !== 'countdown') return;

    if (countdown === 0) {
      setState('recording');
      recorderRef.current?.start();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [state, countdown]);

  // Recording timer (pauses when state is 'paused')
  useEffect(() => {
    if (state !== 'recording') return;

    if (timeRemaining === 0) {
      handleStopRecording();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [state, timeRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartCountdown = () => {
    setCountdown(3);
    setTimeRemaining(roundDuration);
    setState('countdown');
  };

  const handlePauseRecording = () => {
    recorderRef.current?.pause();
    setState('paused');
  };

  const handleResumeRecording = () => {
    recorderRef.current?.resume();
    setState('recording');
  };

  const handleStopRecording = async () => {
    // Show finishing overlay first
    setState('finishing');
    
    try {
      const result = await recorderRef.current?.stop();
      if (result) {
        setRecordedBlob(result.blob);
        const url = createBlobUrl(result.blob);
        setPlaybackUrl(url);
        
        // Wait for the finishing animation before showing complete
        setTimeout(() => {
          setState('complete');
        }, 2000); // 2 second celebration
      }
    } catch {
      setError(t('errors.generic'));
      setState('ready');
    }
  };

  const handleReRecord = async () => {
    // Cleanup previous recording
    if (playbackUrl) {
      revokeBlobUrl(playbackUrl);
      setPlaybackUrl(null);
    }
    setRecordedBlob(null);
    setUploadResult(null);

    // Reinitialize camera
    try {
      const recorder = new VideoRecorder();
      const stream = await recorder.initialize();
      recorderRef.current = recorder;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState('ready');
    } catch {
      setError(t('errors.cameraAccess'));
    }
  };

  const handleUpload = async () => {
    if (!recordedBlob || !session?.accessToken) {
      if (!session?.accessToken) {
        setError(t('session.practice.upload.signInRequired'));
      }
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadVideoToDrive(
        session.accessToken,
        recordedBlob,
        combo.id
      );
      setUploadResult(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        setError(t('errors.tokenExpired'));
      } else {
        setError(t('errors.driveUpload'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'mx-auto max-w-4xl space-y-6'}`}>
      {/* Header - hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              {t('session.practice.title')}
            </h2>
            <p className="text-muted-foreground">{t(combo.nameKey)}</p>
          </div>
          <FullscreenToggle targetRef={containerRef} />
        </div>
      )}

      <div className={`${isFullscreen ? 'h-full' : 'grid gap-6 lg:grid-cols-3'}`}>
        {/* Main video area */}
        <div className={`${isFullscreen ? 'h-full' : 'lg:col-span-2'}`}>
          <div className={`relative ${isFullscreen ? 'h-full' : 'video-container'}`}>
            {/* Live preview - flipped to show non-mirrored view */}
            {state !== 'complete' && (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
              />
            )}

            {/* Playback - flipped video with custom controls */}
            {state === 'complete' && playbackUrl && (
              <div className="relative h-full w-full">
                <video
                  ref={playbackVideoRef}
                  src={playbackUrl}
                  className="h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  playsInline
                  onClick={(e) => {
                    const video = e.currentTarget;
                    if (video.paused) video.play();
                    else video.pause();
                  }}
                />
                {/* Custom controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <button
                    onClick={() => {
                      const video = playbackVideoRef.current;
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
                      const video = playbackVideoRef.current;
                      if (video && video.duration) {
                        video.currentTime = (parseFloat(e.target.value) / 100) * video.duration;
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const video = playbackVideoRef.current;
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
            )}

            {/* Countdown overlay */}
            {state === 'countdown' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <p className="mb-2 text-lg text-white/80">
                    {t('session.practice.countdown')}
                  </p>
                  <div className="countdown-number font-display text-8xl text-white">
                    {countdown}
                  </div>
                </div>
              </div>
            )}

            {/* Finishing overlay */}
            {state === 'finishing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center animate-pulse">
                  <div className="mb-4 text-6xl">🏆</div>
                  <div className="countdown-number font-display text-5xl text-green-400 md:text-7xl">
                    {t('session.practice.roundComplete')}
                  </div>
                  <p className="mt-4 text-xl text-white/80">
                    💪 {t('session.practice.greatJob')}
                  </p>
                </div>
              </div>
            )}

            {/* Recording indicator */}
            {state === 'recording' && (
              <div className={`absolute flex items-center rounded-lg bg-red-600 font-medium text-white ${
                isFullscreen 
                  ? 'left-8 top-8 gap-3 px-5 py-3 text-xl' 
                  : 'left-4 top-4 gap-2 px-3 py-1.5 text-sm'
              }`}>
                <span className={`animate-pulse-ring rounded-full bg-white ${isFullscreen ? 'h-5 w-5' : 'h-3 w-3'}`} />
                {t('session.practice.recording')}
              </div>
            )}

            {/* Combo guide overlay during recording */}
            {(state === 'recording' || state === 'paused') && showComboGuide && (
              <div className={`absolute ${isFullscreen ? 'right-8 top-8 w-[320px]' : 'right-4 top-4 w-[180px]'}`}>
                <div className={`rounded-lg bg-black/80 backdrop-blur-sm ${isFullscreen ? 'p-5' : 'p-3'}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`truncate font-medium ${currentMoveIndex === -1 ? 'text-yellow-400' : 'text-white/70'} ${isFullscreen ? 'text-base' : 'text-xs'}`}>
                      {currentMoveIndex === -1 ? '⏸ Pausa' : t(combo.nameKey)}
                    </span>
                    <button
                      onClick={() => setShowComboGuide(false)}
                      className="ml-2 flex-shrink-0 text-white/50 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className={`${isFullscreen ? 'space-y-2' : 'space-y-1'}`}>
                    {moves.map((move, index) => (
                      <div
                        key={`${move.id}-${index}`}
                        className={`flex items-center gap-3 rounded transition-all duration-200 ${
                          isFullscreen ? 'px-4 py-3' : 'px-2 py-1.5'
                        } ${
                          index === currentMoveIndex
                            ? 'bg-primary-500 scale-105 shadow-lg'
                            : currentMoveIndex === -1
                            ? 'bg-white/5'
                            : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ${
                            isFullscreen ? 'h-10 w-10 text-lg' : 'h-5 w-5 text-xs'
                          } ${
                            index === currentMoveIndex
                              ? 'bg-white text-primary-600'
                              : 'bg-white/20 text-white/70'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={`truncate font-medium ${
                            isFullscreen ? 'text-xl' : 'text-sm'
                          } ${
                            index === currentMoveIndex ? 'text-white' : 'text-white/70'
                          }`}
                        >
                          {t(move.nameKey)}
                        </span>
                        {index === currentMoveIndex && (
                          <span className={`ml-auto flex-shrink-0 ${isFullscreen ? 'text-3xl' : 'text-lg'}`}>
                            {move.type === 'kick' ? '🦵' : 
                             move.type === 'knee' ? '🦿' : 
                             move.type === 'elbow' ? '💪' : '👊'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Rhythm indicator */}
                  <div className={`overflow-hidden rounded-full bg-white/20 ${isFullscreen ? 'mt-4 h-3' : 'mt-2 h-1.5'}`}>
                    <div
                      className="h-full rounded-full bg-primary-400"
                      style={{
                        width: '100%',
                        animation: currentMoveIndex === -1 
                          ? `shrink ${pauseBetweenSequences}ms linear` 
                          : `shrink ${moveIntervalMs}ms linear`,
                        animationIterationCount: 1,
                      }}
                      key={currentMoveIndex} // Reset animation on move change
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Toggle combo guide button when hidden */}
            {(state === 'recording' || state === 'paused') && !showComboGuide && (
              <button
                onClick={() => setShowComboGuide(true)}
                className="absolute right-4 top-4 rounded-lg bg-black/70 px-3 py-1.5 text-sm text-white/70 hover:text-white"
              >
                📋 {t('session.practice.showGuide')}
              </button>
            )}

            {/* Paused modal overlay */}
            {state === 'paused' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className={`rounded-2xl bg-black/80 text-center ${isFullscreen ? 'p-10' : 'p-6'}`}>
                  <div className={`mb-6 flex items-center justify-center gap-3 text-yellow-400 ${isFullscreen ? 'text-4xl' : 'text-2xl'}`}>
                    <svg className={isFullscreen ? 'h-12 w-12' : 'h-8 w-8'} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    <span className="font-display font-bold">{t('session.practice.paused')}</span>
                  </div>
                  <div className={`flex items-center justify-center ${isFullscreen ? 'gap-6' : 'gap-4'}`}>
                    <button
                      onClick={handleResumeRecording}
                      className={`flex items-center gap-2 rounded-xl bg-green-600 font-semibold text-white transition-transform hover:scale-105 ${
                        isFullscreen ? 'px-8 py-4 text-xl' : 'px-5 py-3 text-base'
                      }`}
                    >
                      <svg className={isFullscreen ? 'h-7 w-7' : 'h-5 w-5'} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {t('session.practice.resume')}
                    </button>
                    <button
                      onClick={handleStopRecording}
                      className={`flex items-center gap-2 rounded-xl bg-red-600 font-semibold text-white transition-transform hover:scale-105 ${
                        isFullscreen ? 'px-8 py-4 text-xl' : 'px-5 py-3 text-base'
                      }`}
                    >
                      <svg className={isFullscreen ? 'h-7 w-7' : 'h-5 w-5'} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h12v12H6z" />
                      </svg>
                      {t('session.practice.stop')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Timer - translucent, more visible on hover */}
            {(state === 'recording' || state === 'paused') && (
              <div className={`absolute left-4 right-4 ${isFullscreen ? 'bottom-8' : 'bottom-4'}`}>
                <div className={`rounded-lg backdrop-blur-sm transition-all duration-300 bg-black/30 hover:bg-black/80 ${isFullscreen ? 'p-6' : 'p-3'} group`}>
                  <div className={`flex items-center justify-between text-white/60 group-hover:text-white transition-colors duration-300 ${isFullscreen ? 'mb-4' : 'mb-2'}`}>
                    <div className="flex items-center gap-3">
                      {/* Pause button - only visible during recording */}
                      {state === 'recording' && (
                        <button
                          onClick={handlePauseRecording}
                          className={`rounded-lg bg-yellow-600/60 group-hover:bg-yellow-600 text-white transition-all ${
                            isFullscreen ? 'p-3' : 'p-2'
                          }`}
                          title={t('session.practice.pause')}
                        >
                          <svg className={isFullscreen ? 'h-6 w-6' : 'h-4 w-4'} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        </button>
                      )}
                      <span className={isFullscreen ? 'text-xl' : 'text-sm'}>{t('session.practice.timeRemaining')}</span>
                    </div>
                    <span className={`font-mono ${isFullscreen ? 'text-5xl font-bold' : 'text-xl'}`}>{formatTime(timeRemaining)}</span>
                  </div>
                  <div className={`overflow-hidden rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300 ${isFullscreen ? 'h-4' : 'h-2'}`}>
                    <div
                      className="h-full bg-primary-500/60 group-hover:bg-primary-500 transition-colors duration-300"
                      style={{
                        width: state === 'paused' ? `${(timeRemaining / roundDuration) * 100}%` : '100%',
                        animation: state === 'recording' ? `shrink ${roundDuration}s linear forwards` : 'none',
                        animationDelay: state === 'recording' ? `-${roundDuration - timeRemaining}s` : '0s',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Complete overlay */}
            {state === 'complete' && (
              <div className="absolute right-4 top-4 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white">
                ✓ {t('session.practice.roundComplete')}
              </div>
            )}
          </div>

          {/* Controls - simplified in fullscreen during recording */}
          <div className={`mt-4 space-y-4 ${isFullscreen && state === 'recording' ? 'hidden' : ''}`}>
            {state === 'ready' && (
              <div className="space-y-4">
                {/* Duration selector */}
                <div className="flex flex-col items-center gap-2">
                  <label className="text-sm text-muted-foreground">
                    {t('session.practice.duration')}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newDuration = Math.max(10, roundDuration - 10);
                        setRoundDurationState(newDuration);
                        setTimeRemaining(newDuration);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground hover:bg-primary-600 hover:text-white"
                    >
                      −
                    </button>
                    <div className="flex h-12 min-w-[100px] items-center justify-center rounded-lg bg-muted px-4 font-mono text-2xl font-bold text-foreground">
                      {formatTime(roundDuration)}
                    </div>
                    <button
                      onClick={() => {
                        const newDuration = Math.min(600, roundDuration + 10);
                        setRoundDurationState(newDuration);
                        setTimeRemaining(newDuration);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground hover:bg-primary-600 hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('session.practice.adjustTime')} (10s - 10min)
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={onBack}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    ← {t('common.back')}
                  </button>
                  <button
                    onClick={handleStartCountdown}
                    className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    🎬 {t('session.practice.getReady')}
                  </button>
                </div>
              </div>
            )}

            {state === 'complete' && (
              <div className="space-y-4">
                {/* Background analysis progress indicator */}
                {isAnalyzing && (
                  <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    <span className="text-sm text-muted-foreground">
                      {t('session.practice.analyzing')} {analysisProgress}%
                    </span>
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleReRecord}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    🔄 {t('session.practice.actions.reRecord')}
                  </button>

                  {session?.accessToken ? (
                    <button
                      onClick={handleUpload}
                      disabled={isUploading || !!uploadResult}
                      className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
                        uploadResult
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50`}
                    >
                      {isUploading && (
                        <span className="spinner mr-2 inline-block h-4 w-4 border-white/30 border-t-white" />
                      )}
                      {uploadResult
                        ? `✓ ${t('session.practice.upload.success')}`
                        : isUploading
                        ? t('session.practice.upload.uploading')
                        : `📤 ${t('session.practice.actions.uploadDrive')}`}
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('session.practice.upload.signInRequired')}
                    </p>
                  )}

                </div>
                
                {/* Info message about background analysis */}
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  💡 {t('session.practice.canLeave')}
                </p>

                {/* Back to dashboard button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    ✓ {t('session.review.actions.backToDashboard')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Upload result */}
          {uploadResult && (
            <div className="mt-4 rounded-lg bg-green-500/10 p-3 text-center">
              <a
                href={uploadResult.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
              >
                📁 View in Google Drive →
              </a>
            </div>
          )}
        </div>

        {/* Side panel - hidden in fullscreen */}
        {!isFullscreen && (
          <div className="space-y-4">
            {/* Music panel - pauses when recording is paused */}
            <MusicPanel isPlaying={state === 'recording'} />
          </div>
        )}
      </div>

      {/* Fullscreen exit button */}
      {isFullscreen && (
        <button
          onClick={() => document.exitFullscreen()}
          className="absolute left-4 top-4 z-10 rounded-lg bg-black/50 p-2 text-white/70 hover:bg-black/70 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

