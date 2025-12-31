'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';

const themes = [
  { id: 'light', icon: '☀️' },
  { id: 'dark', icon: '🌙' },
  { id: 'system', icon: '💻' },
] as const;

export function ThemeSwitcher() {
  const t = useTranslations('settings.theme');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = themes.find((t) => t.id === theme) || themes[2];

  // Show placeholder during SSR
  if (!mounted) {
    return (
      <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground">
        <span className="text-base">💻</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Change theme"
      >
        <span className="text-base">
          {theme === 'system'
            ? resolvedTheme === 'dark'
              ? '🌙'
              : '☀️'
            : currentTheme.icon}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right animate-scale-in rounded-lg border border-border bg-card py-1 shadow-lg">
          {themes.map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => {
                setTheme(themeOption.id);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                theme === themeOption.id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              <span className="text-base">{themeOption.icon}</span>
              <span>{t(themeOption.id)}</span>
              {theme === themeOption.id && (
                <svg
                  className="ml-auto h-4 w-4 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

