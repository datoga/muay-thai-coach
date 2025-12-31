// ============================================
// Pose Scoring and Feedback Generation
// ============================================

import type {
  PoseFrame,
  SessionScore,
  CalibrationData,
  AnalysisResult,
} from '../types';
import {
  isGuardUp,
  calculateStability,
  detectPunchExtension,
  detectKneeLift,
  checkFramingQuality,
  estimateViewAngle,
} from './metrics';

interface ScoringContext {
  calibration: CalibrationData | null;
  comboMoveTypes: string[]; // punch, kick, knee, elbow
}

/**
 * Analyze pose frames and generate scoring
 */
export function generateScore(
  frames: PoseFrame[],
  context: ScoringContext
): AnalysisResult {
  const duration = frames.length > 0 ? frames[frames.length - 1].timestamp : 0;

  // Extract landmarks arrays
  const landmarksArray = frames.map((f) => f.landmarks);

  // Calculate subscores
  const guardScore = calculateGuardScore(landmarksArray, context.calibration);
  const stabilityScore = calculateStabilityScore(landmarksArray);
  const executionScore = calculateExecutionScore(landmarksArray, context.comboMoveTypes);
  const timingScore = calculateTimingScore(landmarksArray, frames);

  // Calculate overall score (weighted sum)
  const overall = Math.round(
    guardScore + stabilityScore + executionScore + timingScore
  );

  // Generate feedback
  const { strengths, improvements, warnings } = generateFeedback(
    {
      guard: guardScore,
      stability: stabilityScore,
      execution: executionScore,
      timing: timingScore,
    },
    frames,
    context
  );

  return {
    frameCount: frames.length,
    duration,
    score: {
      overall: Math.min(100, overall),
      guard: Math.round(guardScore),
      stability: Math.round(stabilityScore),
      execution: Math.round(executionScore),
      timing: Math.round(timingScore),
      strengths,
      improvements,
      warnings,
    },
    frames,
  };
}

/**
 * Calculate guard score (0-25)
 */
function calculateGuardScore(
  landmarksArray: PoseFrame['landmarks'][],
  calibration: CalibrationData | null
): number {
  if (landmarksArray.length === 0) return 0;

  // Sample frames throughout the video
  const sampleCount = Math.min(20, landmarksArray.length);
  const step = Math.floor(landmarksArray.length / sampleCount);

  let totalScore = 0;
  let samples = 0;

  for (let i = 0; i < landmarksArray.length; i += step) {
    const result = isGuardUp(landmarksArray[i], calibration);
    totalScore += result.score;
    samples++;
  }

  // Scale to 0-25
  return (totalScore / samples / 100) * 25;
}

/**
 * Calculate stability score (0-20)
 */
function calculateStabilityScore(
  landmarksArray: PoseFrame['landmarks'][]
): number {
  if (landmarksArray.length < 5) return 10; // Default middle score

  const stability = calculateStability(landmarksArray);
  // Scale to 0-20
  return (stability / 100) * 20;
}

/**
 * Calculate execution score based on move types (0-40)
 */
function calculateExecutionScore(
  landmarksArray: PoseFrame['landmarks'][],
  moveTypes: string[]
): number {
  if (landmarksArray.length < 5) return 20; // Default middle score

  let score = 0;
  let checks = 0;

  // Check for punch extensions if punches are in combo
  if (moveTypes.includes('punch')) {
    let punchExtensions = 0;
    for (const landmarks of landmarksArray) {
      const leftExt = detectPunchExtension(landmarks, 'left');
      const rightExt = detectPunchExtension(landmarks, 'right');
      if (leftExt.isExtended || rightExt.isExtended) {
        punchExtensions++;
      }
    }
    // Good if we see some extensions (not too few, not constant)
    const extensionRatio = punchExtensions / landmarksArray.length;
    if (extensionRatio > 0.1 && extensionRatio < 0.5) {
      score += 20;
    } else if (extensionRatio > 0.05) {
      score += 10;
    }
    checks++;
  }

  // Check for knee lifts if kicks/knees in combo
  if (moveTypes.includes('kick') || moveTypes.includes('knee')) {
    let kneeLiftCount = 0;
    for (const landmarks of landmarksArray) {
      const leftLift = detectKneeLift(landmarks, 'left');
      const rightLift = detectKneeLift(landmarks, 'right');
      if (leftLift.isLifted || rightLift.isLifted) {
        kneeLiftCount++;
      }
    }
    const liftRatio = kneeLiftCount / landmarksArray.length;
    if (liftRatio > 0.05 && liftRatio < 0.4) {
      score += 20;
    } else if (liftRatio > 0.02) {
      score += 10;
    }
    checks++;
  }

  // Default score if no specific checks
  if (checks === 0) {
    return 25; // Middle score
  }

  // Scale to 0-40
  return Math.min(40, (score / (checks * 20)) * 40);
}

/**
 * Calculate timing/flow score (0-15)
 */
function calculateTimingScore(
  landmarksArray: PoseFrame['landmarks'][],
  frames: PoseFrame[]
): number {
  if (frames.length < 5) return 8; // Default middle score

  // Analyze rhythm consistency
  // Look for consistent motion patterns
  let rhythmScore = 0;

  // Calculate frame-to-frame movement
  const movements: number[] = [];
  for (let i = 1; i < landmarksArray.length; i++) {
    let totalMovement = 0;
    for (let j = 0; j < landmarksArray[i].length; j++) {
      const dx = landmarksArray[i][j].x - landmarksArray[i - 1][j].x;
      const dy = landmarksArray[i][j].y - landmarksArray[i - 1][j].y;
      totalMovement += Math.sqrt(dx * dx + dy * dy);
    }
    movements.push(totalMovement);
  }

  // Good timing = movement variance is not too high (controlled)
  // but also not too low (showing activity)
  const avgMovement = movements.reduce((a, b) => a + b, 0) / movements.length;
  const variance =
    movements.reduce((sum, m) => sum + Math.pow(m - avgMovement, 2), 0) /
    movements.length;

  // Good if there's moderate, consistent movement
  if (avgMovement > 0.01 && avgMovement < 0.2 && variance < 0.01) {
    rhythmScore = 15;
  } else if (avgMovement > 0.005 && variance < 0.02) {
    rhythmScore = 10;
  } else {
    rhythmScore = 5;
  }

  return rhythmScore;
}

/**
 * Generate feedback based on scores
 */
function generateFeedback(
  scores: {
    guard: number;
    stability: number;
    execution: number;
    timing: number;
  },
  frames: PoseFrame[],
  context: ScoringContext
): {
  strengths: string[];
  improvements: string[];
  warnings: string[];
} {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const warnings: string[] = [];

  // Guard feedback
  if (scores.guard >= 20) {
    strengths.push('feedback.strengths.goodGuard');
  } else if (scores.guard < 15) {
    improvements.push('feedback.improvements.raiseGuard');
  }

  // Stability feedback
  if (scores.stability >= 16) {
    strengths.push('feedback.strengths.stableBase');
  } else if (scores.stability < 10) {
    improvements.push('feedback.improvements.stayBalanced');
  }

  // Execution feedback
  if (scores.execution >= 32) {
    strengths.push('feedback.strengths.goodExtension');
  } else if (scores.execution < 20) {
    improvements.push('feedback.improvements.extendMore');
  }

  // Timing feedback
  if (scores.timing >= 12) {
    strengths.push('feedback.strengths.goodTiming');
  } else if (scores.timing < 8) {
    improvements.push('feedback.improvements.improveFlow');
  }

  // Add general good form if overall is high
  if (scores.guard + scores.stability + scores.execution + scores.timing > 70) {
    strengths.push('feedback.strengths.goodForm');
  }

  // Check for warnings
  if (frames.length < 50) {
    warnings.push('feedback.warnings.lowFrameCount');
  }

  // Check framing quality from last frame
  if (frames.length > 0) {
    const framing = checkFramingQuality(frames[frames.length - 1].landmarks);
    if (framing.overallScore < 60) {
      warnings.push('feedback.warnings.poorFraming');
    }
  }

  // Check view angle
  if (context.calibration?.viewAngle === 'side') {
    warnings.push('feedback.warnings.sidewaysView');
  }

  // Ensure we have at least some feedback
  if (strengths.length === 0) {
    strengths.push('feedback.strengths.goodForm');
  }
  if (improvements.length === 0 && scores.guard + scores.stability + scores.execution + scores.timing < 80) {
    improvements.push('feedback.improvements.returnFaster');
  }

  return {
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    warnings: warnings.slice(0, 3),
  };
}

/**
 * Get move types from combo for scoring context
 */
export function getMoveTypesFromCombo(
  moveIds: string[],
  moves: Record<string, { type: string }>
): string[] {
  const types = new Set<string>();
  for (const id of moveIds) {
    if (moves[id]) {
      types.add(moves[id].type);
    }
  }
  return Array.from(types);
}

