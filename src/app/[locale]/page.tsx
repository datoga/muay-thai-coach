import { useTranslations } from 'next-intl';
import { HeroCTAs } from '@/components/HeroCTAs';
import { LandingRedirect } from '@/components/LandingRedirect';
import { FeatureCard } from '@/components/ui/FeatureCard';

export default function LandingPage() {
  const t = useTranslations();

  return (
    <LandingRedirect>
      <div className="relative min-h-[calc(100vh-4rem)]">
        {/* Background pattern */}
        <div className="absolute inset-0 thai-pattern opacity-50" />

        {/* Hero section */}
        <section className="relative gradient-hero px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-4 font-display text-5xl tracking-wide text-foreground md:text-7xl">
              {t('landing.hero.title')}
              <br />
              <span className="text-primary-500">{t('landing.hero.subtitle')}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {t('landing.hero.description')}
            </p>
            <HeroCTAs />
          </div>
        </section>

        {/* Features section */}
        <section className="relative bg-muted/30 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="mb-2 font-display text-3xl tracking-wide text-foreground">
                {t('landing.features.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('landing.features.subtitle')}
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon="📖"
                title={t('landing.features.learn.title')}
                description={t('landing.features.learn.description')}
                gradientFrom="#22c55e"
                gradientTo="#059669"
              />
              <FeatureCard
                icon="🎥"
                title={t('landing.features.practice.title')}
                description={t('landing.features.practice.description')}
                gradientFrom="#eab308"
                gradientTo="#d97706"
              />
              <FeatureCard
                icon="📊"
                title={t('landing.features.review.title')}
                description={t('landing.features.review.description')}
                gradientFrom="#ef4444"
                gradientTo="#e11d48"
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border px-4 py-8">
          <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} MuayThai Coach. Train hard, fight easy.</p>
          </div>
        </footer>
      </div>
    </LandingRedirect>
  );
}

