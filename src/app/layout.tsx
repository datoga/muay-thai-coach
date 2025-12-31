import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
});

export const metadata: Metadata = {
  title: 'MuayThai Coach',
  description: 'Train Muay Thai with AI-powered coaching',
  keywords: ['muay thai', 'training', 'martial arts', 'fitness', 'AI coach'],
  authors: [{ name: 'MuayThai Coach Team' }],
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${bebasNeue.variable} antialiased`} suppressHydrationWarning>
        {gaMeasurementId && <GoogleAnalytics measurementId={gaMeasurementId} />}
        {children}
      </body>
    </html>
  );
}

