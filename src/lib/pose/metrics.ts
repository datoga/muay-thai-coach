// ============================================
// Pose Metrics Calculations
// ============================================

import type { NormalizedLandmark, CalibrationData, ViewAngle } from '../types';
import { LANDMARK_INDICES } from './pose';

/**
 * Calculate angle between three points (in degrees)
 */
export function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark, // vertex
  c: NormalizedLandmark
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Calculate distance between two landmarks
 */
export function calculateDistance(
  a: NormalizedLandmark,
  b: NormalizedLandmark
): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Get elbow angle (shoulder -> elbow -> wrist)
 */
export function getElbowAngle(
  landmarks: NormalizedLandmark[],
  side: 'left' | 'right'
): number {
  const shoulderIdx =
    side === 'left'
      ? LANDMARK_INDICES.LEFT_SHOULDER
      : LANDMARK_INDICES.RIGHT_SHOULDER;
  const elbowIdx =
    side === 'left'
      ? LANDMARK_INDICES.LEFT_ELBOW
      : LANDMARK_INDICES.RIGHT_ELBOW;
  const wristIdx =
    side === 'left'
      ? LANDMARK_INDICES.LEFT_WRIST
      : LANDMARK_INDICES.RIGHT_WRIST;

  return calculateAngle(
    landmarks[shoulderIdx],
    landmarks[elbowIdx],
    landmarks[wristIdx]
  );
}

/**
 * Get knee angle (hip -> knee -> ankle)
 */
export function getKneeAngle(
  landmarks: NormalizedLandmark[],
  side: 'left' | 'right'
): number {
  const hipIdx =
    side === 'left' ? LANDMARK_INDICES.LEFT_HIP : LANDMARK_INDICES.RIGHT_HIP;
  const kneeIdx =
    side === 'left' ? LANDMARK_INDICES.LEFT_KNEE : LANDMARK_INDICES.RIGHT_KNEE;
  const ankleIdx =
    side === 'left'
      ? LANDMARK_INDICES.LEFT_ANKLE
      : LANDMARK_INDICES.RIGHT_ANKLE;

  return calculateAngle(
    landmarks[hipIdx],
    landmarks[kneeIdx],
    landmarks[ankleIdx]
  );
}

/**
 * Get shoulder width (normalized)
 */
export function getShoulderWidth(landmarks: NormalizedLandmark[]): number {
  return calculateDistance(
    landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
    landmarks[LANDMARK_INDICES.RIGHT_SHOULDER]
  );
}

/**
 * Get hip width (normalized)
 */
export function getHipWidth(landmarks: NormalizedLandmark[]): number {
  return calculateDistance(
    landmarks[LANDMARK_INDICES.LEFT_HIP],
    landmarks[LANDMARK_INDICES.RIGHT_HIP]
  );
}

/**
 * Get torso length (shoulder to hip)
 */
export function getTorsoLength(landmarks: NormalizedLandmark[]): number {
  const shoulderCenter = {
    x:
      (landmarks[LANDMARK_INDICES.LEFT_SHOULDER].x +
        landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].x) /
      2,
    y:
      (landmarks[LANDMARK_INDICES.LEFT_SHOULDER].y +
        landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].y) /
      2,
    z: 0,
  };
  const hipCenter = {
    x:
      (landmarks[LANDMARK_INDICES.LEFT_HIP].x +
        landmarks[LANDMARK_INDICES.RIGHT_HIP].x) /
      2,
    y:
      (landmarks[LANDMARK_INDICES.LEFT_HIP].y +
        landmarks[LANDMARK_INDICES.RIGHT_HIP].y) /
      2,
    z: 0,
  };
  return calculateDistance(shoulderCenter, hipCenter);
}

/**
 * Estimate view angle based on shoulder/torso ratio
 */
export function estimateViewAngle(landmarks: NormalizedLandmark[]): ViewAngle {
  const shoulderWidth = getShoulderWidth(landmarks);
  const torsoLength = getTorsoLength(landmarks);

  // Also check z-depth difference between shoulders if available
  const leftShoulderZ =
    landmarks[LANDMARK_INDICES.LEFT_SHOULDER].z || 0;
  const rightShoulderZ =
    landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].z || 0;
  const zDiff = Math.abs(leftShoulderZ - rightShoulderZ);

  const ratio = shoulderWidth / torsoLength;

  // Higher ratio = more frontal view
  // Lower ratio = more side view
  if (ratio > 0.6 && zDiff < 0.1) {
    return 'front';
  } else if (ratio < 0.3 || zDiff > 0.2) {
    return 'side';
  } else {
    return 'three-quarter';
  }
}

/**
 * Check if guard is up (wrists near face)
 */
export function isGuardUp(
  landmarks: NormalizedLandmark[],
  calibration: CalibrationData | null
): { score: number; leftUp: boolean; rightUp: boolean } {
  const nose = landmarks[LANDMARK_INDICES.NOSE];
  const leftWrist = landmarks[LANDMARK_INDICES.LEFT_WRIST];
  const rightWrist = landmarks[LANDMARK_INDICES.RIGHT_WRIST];
  const leftShoulder = landmarks[LANDMARK_INDICES.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDICES.RIGHT_SHOULDER];

  // Wrists should be above mid-chest and near face
  const midChestY = (leftShoulder.y + rightShoulder.y) / 2;
  const faceRegionBottom = nose.y + 0.1; // Below nose

  // Adjust threshold for gloves
  const threshold = calibration?.wearingGloves ? 0.15 : 0.1;

  const leftUp =
    leftWrist.y < midChestY &&
    leftWrist.y < faceRegionBottom &&
    Math.abs(leftWrist.x - nose.x) < 0.3;

  const rightUp =
    rightWrist.y < midChestY &&
    rightWrist.y < faceRegionBottom &&
    Math.abs(rightWrist.x - nose.x) < 0.3;

  // Score based on position quality
  let score = 0;
  if (leftUp) score += 50;
  if (rightUp) score += 50;

  // Bonus for optimal height
  const optimalHeight = nose.y - 0.05;
  if (leftUp && Math.abs(leftWrist.y - optimalHeight) < threshold) score += 10;
  if (rightUp && Math.abs(rightWrist.y - optimalHeight) < threshold) score += 10;

  return {
    score: Math.min(100, score),
    leftUp,
    rightUp,
  };
}

/**
 * Calculate stability score based on hip movement variance
 */
export function calculateStability(
  frames: NormalizedLandmark[][]
): number {
  if (frames.length < 2) return 100;

  // Track hip center movement
  const hipPositions = frames.map((landmarks) => ({
    x:
      (landmarks[LANDMARK_INDICES.LEFT_HIP].x +
        landmarks[LANDMARK_INDICES.RIGHT_HIP].x) /
      2,
    y:
      (landmarks[LANDMARK_INDICES.LEFT_HIP].y +
        landmarks[LANDMARK_INDICES.RIGHT_HIP].y) /
      2,
  }));

  // Calculate variance
  const meanX = hipPositions.reduce((sum, p) => sum + p.x, 0) / hipPositions.length;
  const meanY = hipPositions.reduce((sum, p) => sum + p.y, 0) / hipPositions.length;

  const variance =
    hipPositions.reduce((sum, p) => {
      return sum + Math.pow(p.x - meanX, 2) + Math.pow(p.y - meanY, 2);
    }, 0) / hipPositions.length;

  // Lower variance = higher stability
  // Scale to 0-100 (variance of 0.01 = 50% stability)
  const stability = Math.max(0, 100 - variance * 5000);
  return Math.min(100, stability);
}

/**
 * Detect punch extension (elbow angle near 180°)
 */
export function detectPunchExtension(
  landmarks: NormalizedLandmark[],
  side: 'left' | 'right'
): { isExtended: boolean; angle: number } {
  const angle = getElbowAngle(landmarks, side);
  // Punch is extended when elbow angle is 160-180°
  const isExtended = angle >= 155;
  return { isExtended, angle };
}

/**
 * Detect knee lift (for kicks/knees)
 */
export function detectKneeLift(
  landmarks: NormalizedLandmark[],
  side: 'left' | 'right'
): { isLifted: boolean; height: number } {
  const hipIdx =
    side === 'left' ? LANDMARK_INDICES.LEFT_HIP : LANDMARK_INDICES.RIGHT_HIP;
  const kneeIdx =
    side === 'left' ? LANDMARK_INDICES.LEFT_KNEE : LANDMARK_INDICES.RIGHT_KNEE;

  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];

  // Knee lift detected when knee is at or above hip level
  const height = hip.y - knee.y;
  const isLifted = height > 0;

  return { isLifted, height };
}

/**
 * Check framing quality (are key landmarks visible?)
 */
export function checkFramingQuality(
  landmarks: NormalizedLandmark[]
): { headVisible: boolean; hipsVisible: boolean; anklesVisible: boolean; overallScore: number } {
  const threshold = 0.3; // visibility threshold

  const head = landmarks[LANDMARK_INDICES.NOSE];
  const leftHip = landmarks[LANDMARK_INDICES.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_INDICES.RIGHT_HIP];
  const leftAnkle = landmarks[LANDMARK_INDICES.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARK_INDICES.RIGHT_ANKLE];

  const headVisible = (head.visibility || 0) > threshold;
  const hipsVisible =
    (leftHip.visibility || 0) > threshold &&
    (rightHip.visibility || 0) > threshold;
  const anklesVisible =
    (leftAnkle.visibility || 0) > threshold &&
    (rightAnkle.visibility || 0) > threshold;

  let overallScore = 0;
  if (headVisible) overallScore += 40;
  if (hipsVisible) overallScore += 40;
  if (anklesVisible) overallScore += 20;

  return { headVisible, hipsVisible, anklesVisible, overallScore };
}

