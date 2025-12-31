'use client';

interface ScoreRingProps {
  score: number;
  maxScore: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Circular progress ring for displaying scores
 */
export function ScoreRing({ score, maxScore, label, size = 'md' }: ScoreRingProps) {
  const percentage = (score / maxScore) * 100;
  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const radius = size === 'lg' ? 50 : size === 'md' ? 35 : 25;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  const getColor = (pct: number) => {
    if (pct >= 80) return '#22c55e'; // green
    if (pct >= 60) return '#facc15'; // yellow
    if (pct >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        className={`-rotate-90 ${
          size === 'lg' ? 'h-28 w-28' : size === 'md' ? 'h-20 w-20' : 'h-14 w-14'
        }`}
      >
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Score circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          className="transition-all duration-500"
        />
      </svg>
      <div className="mt-1 text-center">
        <div
          className={`font-bold ${
            size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'
          }`}
        >
          {Math.round(score)}
        </div>
        <div
          className={`text-muted-foreground ${size === 'lg' ? 'text-sm' : 'text-xs'}`}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

