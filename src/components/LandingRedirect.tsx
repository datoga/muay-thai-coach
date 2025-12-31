'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';

interface LandingRedirectProps {
  children: React.ReactNode;
}

export function LandingRedirect({ children }: LandingRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setIsRedirecting(true);
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  // Show loading while checking auth or redirecting
  if (status === 'loading' || isRedirecting) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 h-8 w-8 border-primary-500" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // User not logged in - show landing page
  return <>{children}</>;
}
