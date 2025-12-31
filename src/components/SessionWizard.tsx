'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { Combo, CalibrationData, SessionPhase } from '@/lib/types';
import { getCalibration } from '@/lib/settings';
import { getComboById } from '@/lib/combos';
import { CalibrationPhase } from './CalibrationPhase';
import { LearnPhase } from './LearnPhase';
import { PracticePhase } from './PracticePhase';

interface SessionWizardProps {
  comboId: string;
}

export function SessionWizard({ comboId }: SessionWizardProps) {
  const t = useTranslations();
  const router = useRouter();

  const [combo, setCombo] = useState<Combo | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('calibration');
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);

  // Load combo and check calibration
  useEffect(() => {
    const loadedCombo = getComboById(comboId);
    if (!loadedCombo) {
      router.push('/dashboard');
      return;
    }
    setCombo(loadedCombo);

    const existingCalibration = getCalibration();
    setCalibration(existingCalibration);

    // Skip calibration if already done
    if (existingCalibration) {
      setPhase('learn');
    }
  }, [comboId, router]);

  const handleCalibrationComplete = (newCalibration: CalibrationData) => {
    setCalibration(newCalibration);
    setPhase('learn');
  };

  const handleLearnContinue = () => {
    setPhase('practice');
  };

  const handlePracticeBack = () => {
    setPhase('learn');
  };

  if (!combo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner h-8 w-8 border-primary-500/30 border-t-primary-500" />
      </div>
    );
  }

  // Phase stepper (review phase removed - analysis happens in background)
  const phases: SessionPhase[] = ['calibration', 'learn', 'practice'];
  const currentPhaseIndex = phases.indexOf(phase);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Phase stepper */}
      <div className="mb-8">
        <div className="phase-stepper">
          {phases.map((p, index) => {
            const isCompleted = index < currentPhaseIndex;
            const isActive = p === phase;
            const isPending = index > currentPhaseIndex;

            // Skip calibration in stepper if it was already done
            if (p === 'calibration' && calibration && phase !== 'calibration') {
              return null;
            }

            return (
              <div key={p} className="flex items-center">
                <div
                  className={`phase-step ${
                    isCompleted
                      ? 'completed'
                      : isActive
                      ? 'active'
                      : 'pending'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
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
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  <span>{t(`session.phases.${p}`)}</span>
                </div>
                {index < phases.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-8 ${
                      isCompleted ? 'bg-green-600' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase content */}
      {phase === 'calibration' && (
        <CalibrationPhase
          onComplete={handleCalibrationComplete}
          existingCalibration={calibration}
        />
      )}

      {phase === 'learn' && (
        <LearnPhase
          combo={combo}
          calibration={calibration}
          onContinue={handleLearnContinue}
        />
      )}

      {phase === 'practice' && (
        <PracticePhase
          combo={combo}
          onBack={handlePracticeBack}
        />
      )}
    </div>
  );
}

