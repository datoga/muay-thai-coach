'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 font-display text-6xl text-primary-500">404</h1>
      <h2 className="mb-2 text-2xl font-semibold text-foreground">
        Page Not Found
      </h2>
      <p className="mb-8 text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

