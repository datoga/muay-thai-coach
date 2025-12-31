'use client';

import { useTranslations } from 'next-intl';
import { useSession, signIn } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

export function HeroCTAs() {
  const t = useTranslations();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <div className="h-14 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-14 w-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  // User is logged in - show single CTA to go to dashboard
  if (session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-700 hover:scale-105"
        >
          🥊 {t('landing.cta.start')}
        </Link>
      </div>
    );
  }

  // User is not logged in - show both options
  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-700 hover:scale-105"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {t('landing.cta.signIn')}
      </button>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg border-2 border-border px-8 py-4 text-lg font-semibold text-muted-foreground transition-all hover:border-primary-500 hover:text-foreground"
      >
        {t('landing.cta.continueWithout')}
      </Link>
    </div>
  );
}

