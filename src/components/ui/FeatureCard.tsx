interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

/**
 * Feature card for landing page
 */
export function FeatureCard({ 
  icon, 
  title, 
  description, 
  gradientFrom, 
  gradientTo 
}: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:scale-105">
      <div 
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-3xl text-white"
        style={{ 
          background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})` 
        }}
      >
        {icon}
      </div>
      <h3 className="mb-3 font-display text-2xl tracking-wide text-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

