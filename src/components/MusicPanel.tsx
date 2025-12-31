'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { MusicMode, MusicSettings } from '@/lib/types';
import { getMusicSettings, saveMusicSettings } from '@/lib/settings';

interface MusicPanelProps {
  isPlaying: boolean;
  onSettingsChange?: (settings: MusicSettings) => void;
}

export function MusicPanel({ isPlaying, onSettingsChange }: MusicPanelProps) {
  const t = useTranslations('session.practice.music');
  const [settings, setSettings] = useState<MusicSettings>(() => getMusicSettings());
  const [spotifyInput, setSpotifyInput] = useState(settings.spotifyEmbedUrl || '');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Available loops (would be stored in /public/audio)
  const loops = [
    { id: 'beat1', name: 'Training Beat 1' },
    { id: 'beat2', name: 'Training Beat 2' },
  ];

  const updateSettings = useCallback((updates: Partial<MusicSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveMusicSettings(newSettings);
    onSettingsChange?.(newSettings);
  }, [settings, onSettingsChange]);

  // Handle background audio
  useEffect(() => {
    if (settings.mode === 'loop' && settings.selectedLoop && isPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio(`/audio/${settings.selectedLoop}.mp3`);
        audioRef.current.loop = true;
      }
      audioRef.current.volume = settings.volume;
      audioRef.current.play().catch(() => {
        // Audio play failed, possibly due to autoplay restrictions
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [settings.mode, settings.selectedLoop, settings.volume, isPlaying]);

  // Stop all audio when not playing
  useEffect(() => {
    if (!isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Parse Spotify URL to embed URL
  const parseSpotifyUrl = (url: string): string | null => {
    try {
      const spotifyUrl = new URL(url);
      if (!spotifyUrl.hostname.includes('spotify.com')) return null;

      // Convert open.spotify.com/track/ID to open.spotify.com/embed/track/ID
      const pathParts = spotifyUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        const type = pathParts[0]; // track, album, playlist
        const id = pathParts[1].split('?')[0];
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSpotifySubmit = () => {
    const embedUrl = parseSpotifyUrl(spotifyInput);
    if (embedUrl) {
      updateSettings({ spotifyEmbedUrl: embedUrl, mode: 'spotify-embed' });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 font-medium text-foreground">{t('title')}</h3>

      {/* Mode selector */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {(['off', 'loop', 'spotify-embed'] as MusicMode[]).map(
          (mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ mode })}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                settings.mode === mode
                  ? 'bg-primary-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode === 'off' && t('off')}
              {mode === 'loop' && t('loop')}
              {mode === 'spotify-embed' && t('spotify')}
            </button>
          )
        )}
      </div>

      {/* Mode-specific controls */}
      {settings.mode === 'loop' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {loops.map((loop) => (
              <button
                key={loop.id}
                onClick={() => updateSettings({ selectedLoop: loop.id })}
                className={`rounded-lg px-3 py-2 text-xs transition-colors ${
                  settings.selectedLoop === loop.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                🎵 {loop.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {settings.mode === 'spotify-embed' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t('spotifyUrl')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={spotifyInput}
                onChange={(e) => setSpotifyInput(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onClick={handleSpotifySubmit}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                ✓
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t('spotifyHelp')}</p>
          </div>

          {settings.spotifyEmbedUrl && (
            <div className="spotify-embed aspect-[3/1] w-full">
              <iframe
                src={settings.spotifyEmbedUrl}
                width="100%"
                height="100%"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      {/* Volume control (for all modes except off) */}
      {settings.mode !== 'off' && (
        <div className="mt-4">
          <label className="mb-1 block text-xs text-muted-foreground">
            {t('volume')}: {Math.round(settings.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume * 100}
            onChange={(e) =>
              updateSettings({ volume: parseInt(e.target.value) / 100 })
            }
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

