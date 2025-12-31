import type { Move, Combo, AvatarKeyframe, AvatarPose } from './types';

// ============================================
// Base Guard Pose (Orthodox Stance)
// ============================================
// Orthodox guard stance: left side forward (lead), right side back (power)
// This is viewed from a 3/4 angle perspective
// For southpaw, the mirrorPose function will flip it automatically
const GUARD_POSE: AvatarPose = {
  // Head slightly turned toward opponent
  head: { x: 0.03, y: -0.4 },
  // Lead shoulder (left) forward and up for protection
  leftShoulder: { x: -0.1, y: -0.22 },
  // Rear shoulder (right) back
  rightShoulder: { x: 0.18, y: -0.18 },
  // Lead arm up protecting chin
  leftElbow: { x: -0.15, y: -0.08 },
  rightElbow: { x: 0.25, y: -0.02 },
  // Hands up in guard position
  leftWrist: { x: -0.08, y: -0.28 },
  rightWrist: { x: 0.12, y: -0.3 },
  // Hips turned - lead hip forward
  leftHip: { x: -0.06, y: 0.1 },
  rightHip: { x: 0.14, y: 0.18 },
  // Lead leg (left) forward - knee more forward and bent
  leftKnee: { x: 0.0, y: 0.32 },
  // Rear leg (right) back - more bent for power, clearly behind
  rightKnee: { x: 0.18, y: 0.46 },
  // Lead foot forward (smaller y = higher on screen = closer to viewer)
  leftAnkle: { x: 0.02, y: 0.52 },
  // Rear foot back (larger y = lower on screen = further from viewer)
  rightAnkle: { x: 0.22, y: 0.72 },
};

// ============================================
// Move Keyframes (Smooth, detailed animations)
// ============================================

// JAB - Quick straight punch with lead hand
const createJabKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Slight weight shift back
  {
    time: 0.08,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.12, y: -0.21 },
      leftElbow: { x: -0.16, y: -0.09 },
      leftWrist: { x: -0.10, y: -0.26 },
    },
  },
  // Begin extension
  {
    time: 0.18,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.09, y: -0.22 },
      leftElbow: { x: -0.05, y: -0.15 },
      leftWrist: { x: 0.08, y: -0.27 },
    },
  },
  // Mid extension
  {
    time: 0.28,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.07, y: -0.23 },
      leftElbow: { x: 0.05, y: -0.22 },
      leftWrist: { x: 0.25, y: -0.28 },
    },
  },
  // Near full extension
  {
    time: 0.38,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.05, y: -0.24 },
      leftElbow: { x: 0.12, y: -0.25 },
      leftWrist: { x: 0.38, y: -0.29 },
    },
  },
  // Full extension - SNAP
  {
    time: 0.48,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.03, y: -0.25 },
      leftElbow: { x: 0.18, y: -0.27 },
      leftWrist: { x: 0.48, y: -0.30 },
    },
  },
  // Begin retraction
  {
    time: 0.58,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.05, y: -0.24 },
      leftElbow: { x: 0.10, y: -0.23 },
      leftWrist: { x: 0.30, y: -0.28 },
    },
  },
  // Mid retraction
  {
    time: 0.70,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.08, y: -0.22 },
      leftElbow: { x: -0.02, y: -0.15 },
      leftWrist: { x: 0.10, y: -0.26 },
    },
  },
  // Almost back
  {
    time: 0.85,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.09, y: -0.22 },
      leftElbow: { x: -0.12, y: -0.09 },
      leftWrist: { x: -0.05, y: -0.27 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// CROSS - Power straight with rear hand, full hip rotation
const createCrossKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Weight shift, begin rotation
  {
    time: 0.10,
    pose: {
      ...GUARD_POSE,
      rightShoulder: { x: 0.16, y: -0.19 },
      rightElbow: { x: 0.22, y: -0.04 },
      rightWrist: { x: 0.14, y: -0.28 },
      leftHip: { x: -0.08, y: 0.11 },
      rightHip: { x: 0.12, y: 0.17 },
      rightAnkle: { x: 0.20, y: 0.70 },
    },
  },
  // Hip turning, arm loading
  {
    time: 0.20,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.01, y: -0.40 },
      rightShoulder: { x: 0.12, y: -0.21 },
      rightElbow: { x: 0.15, y: -0.10 },
      rightWrist: { x: 0.12, y: -0.26 },
      leftHip: { x: -0.10, y: 0.12 },
      rightHip: { x: 0.10, y: 0.17 },
      rightAnkle: { x: 0.18, y: 0.68 },
    },
  },
  // Explosive rotation begins
  {
    time: 0.30,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.02, y: -0.40 },
      rightShoulder: { x: 0.08, y: -0.23 },
      rightElbow: { x: 0.02, y: -0.18 },
      rightWrist: { x: -0.05, y: -0.27 },
      leftHip: { x: -0.13, y: 0.12 },
      rightHip: { x: 0.07, y: 0.18 },
      rightAnkle: { x: 0.15, y: 0.65 },
    },
  },
  // Mid punch, hips rotating
  {
    time: 0.40,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.03, y: -0.40 },
      rightShoulder: { x: 0.05, y: -0.24 },
      rightElbow: { x: -0.08, y: -0.24 },
      rightWrist: { x: -0.22, y: -0.28 },
      leftHip: { x: -0.15, y: 0.12 },
      rightHip: { x: 0.05, y: 0.18 },
      rightAnkle: { x: 0.12, y: 0.63 },
    },
  },
  // Full extension - IMPACT
  {
    time: 0.50,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.04, y: -0.40 },
      rightShoulder: { x: 0.02, y: -0.25 },
      rightElbow: { x: -0.15, y: -0.27 },
      rightWrist: { x: -0.40, y: -0.29 },
      leftHip: { x: -0.16, y: 0.11 },
      rightHip: { x: 0.04, y: 0.19 },
      rightAnkle: { x: 0.10, y: 0.62 },
    },
  },
  // Begin recovery
  {
    time: 0.60,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.02, y: -0.40 },
      rightShoulder: { x: 0.06, y: -0.23 },
      rightElbow: { x: -0.05, y: -0.20 },
      rightWrist: { x: -0.20, y: -0.28 },
      leftHip: { x: -0.12, y: 0.11 },
      rightHip: { x: 0.08, y: 0.18 },
    },
  },
  // Retraction
  {
    time: 0.72,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.01, y: -0.40 },
      rightShoulder: { x: 0.12, y: -0.20 },
      rightElbow: { x: 0.10, y: -0.10 },
      rightWrist: { x: 0.05, y: -0.25 },
      leftHip: { x: -0.08, y: 0.10 },
      rightHip: { x: 0.12, y: 0.18 },
    },
  },
  // Almost back
  {
    time: 0.86,
    pose: {
      ...GUARD_POSE,
      rightShoulder: { x: 0.16, y: -0.18 },
      rightElbow: { x: 0.22, y: -0.04 },
      rightWrist: { x: 0.13, y: -0.28 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// HOOK - Horizontal arc punch with lead hand
const createHookKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Load - slight drop and rotate back
  {
    time: 0.10,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.04, y: -0.39 },
      leftShoulder: { x: -0.14, y: -0.20 },
      leftElbow: { x: -0.22, y: -0.08 },
      leftWrist: { x: -0.18, y: -0.22 },
      leftHip: { x: -0.08, y: 0.11 },
      rightHip: { x: 0.12, y: 0.17 },
    },
  },
  // Wind up - arm back, body coiled
  {
    time: 0.20,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.06, y: -0.39 },
      leftShoulder: { x: -0.18, y: -0.18 },
      leftElbow: { x: -0.32, y: -0.10 },
      leftWrist: { x: -0.35, y: -0.20 },
      leftHip: { x: -0.12, y: 0.12 },
      rightHip: { x: 0.08, y: 0.17 },
    },
  },
  // Begin swing - elbow stays bent at 90°
  {
    time: 0.30,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.02, y: -0.40 },
      leftShoulder: { x: -0.14, y: -0.20 },
      leftElbow: { x: -0.18, y: -0.18 },
      leftWrist: { x: -0.15, y: -0.25 },
      leftHip: { x: -0.15, y: 0.12 },
      rightHip: { x: 0.05, y: 0.17 },
    },
  },
  // Mid swing - horizontal arc
  {
    time: 0.40,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.02, y: -0.40 },
      leftShoulder: { x: -0.10, y: -0.22 },
      leftElbow: { x: 0.0, y: -0.22 },
      leftWrist: { x: 0.05, y: -0.28 },
      leftHip: { x: -0.17, y: 0.12 },
      rightHip: { x: 0.03, y: 0.18 },
    },
  },
  // Impact - maximum rotation
  {
    time: 0.50,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.05, y: -0.40 },
      leftShoulder: { x: -0.06, y: -0.23 },
      leftElbow: { x: 0.12, y: -0.23 },
      leftWrist: { x: 0.22, y: -0.28 },
      leftHip: { x: -0.18, y: 0.11 },
      rightHip: { x: 0.02, y: 0.18 },
    },
  },
  // Follow through
  {
    time: 0.60,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.03, y: -0.40 },
      leftShoulder: { x: -0.08, y: -0.22 },
      leftElbow: { x: 0.08, y: -0.20 },
      leftWrist: { x: 0.18, y: -0.26 },
      leftHip: { x: -0.15, y: 0.12 },
      rightHip: { x: 0.05, y: 0.18 },
    },
  },
  // Begin return
  {
    time: 0.72,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.0, y: -0.40 },
      leftShoulder: { x: -0.10, y: -0.21 },
      leftElbow: { x: -0.05, y: -0.12 },
      leftWrist: { x: 0.02, y: -0.25 },
      leftHip: { x: -0.10, y: 0.11 },
      rightHip: { x: 0.10, y: 0.18 },
    },
  },
  // Almost back
  {
    time: 0.86,
    pose: {
      ...GUARD_POSE,
      leftShoulder: { x: -0.10, y: -0.22 },
      leftElbow: { x: -0.13, y: -0.08 },
      leftWrist: { x: -0.06, y: -0.27 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// TEEP - Push kick with lead leg
const createTeepKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Weight shift to rear leg
  {
    time: 0.08,
    pose: {
      ...GUARD_POSE,
      leftKnee: { x: 0.0, y: 0.34 },
      leftAnkle: { x: 0.02, y: 0.54 },
      rightKnee: { x: 0.17, y: 0.44 },
    },
  },
  // Begin knee lift
  {
    time: 0.18,
    pose: {
      ...GUARD_POSE,
      leftHip: { x: -0.06, y: 0.12 },
      leftKnee: { x: -0.05, y: 0.28 },
      leftAnkle: { x: -0.08, y: 0.45 },
      rightKnee: { x: 0.16, y: 0.42 },
    },
  },
  // Chamber - knee high
  {
    time: 0.30,
    pose: {
      ...GUARD_POSE,
      leftHip: { x: -0.05, y: 0.14 },
      leftKnee: { x: -0.08, y: 0.18 },
      leftAnkle: { x: -0.12, y: 0.35 },
      rightKnee: { x: 0.15, y: 0.40 },
    },
  },
  // Begin extension
  {
    time: 0.42,
    pose: {
      ...GUARD_POSE,
      leftHip: { x: -0.04, y: 0.15 },
      leftKnee: { x: -0.05, y: 0.15 },
      leftAnkle: { x: 0.05, y: 0.25 },
      rightKnee: { x: 0.14, y: 0.38 },
    },
  },
  // Full extension - PUSH
  {
    time: 0.55,
    pose: {
      ...GUARD_POSE,
      leftHip: { x: -0.03, y: 0.16 },
      leftKnee: { x: -0.02, y: 0.12 },
      leftAnkle: { x: 0.18, y: 0.18 },
      rightKnee: { x: 0.13, y: 0.36 },
    },
  },
  // Begin retraction
  {
    time: 0.65,
    pose: {
      ...GUARD_POSE,
      leftHip: { x: -0.04, y: 0.14 },
      leftKnee: { x: -0.06, y: 0.18 },
      leftAnkle: { x: 0.0, y: 0.30 },
      rightKnee: { x: 0.15, y: 0.40 },
    },
  },
  // Knee back to chamber
  {
    time: 0.76,
    pose: {
      ...GUARD_POSE,
      leftHip: { x: -0.05, y: 0.12 },
      leftKnee: { x: -0.04, y: 0.25 },
      leftAnkle: { x: -0.06, y: 0.40 },
      rightKnee: { x: 0.16, y: 0.43 },
    },
  },
  // Setting down
  {
    time: 0.88,
    pose: {
      ...GUARD_POSE,
      leftKnee: { x: -0.01, y: 0.30 },
      leftAnkle: { x: 0.0, y: 0.50 },
      rightKnee: { x: 0.17, y: 0.45 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// LOW KICK - Shin kick with rear leg (kicks forward-diagonal, not pure side)
const createLowKickKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Step and shift weight to lead leg
  {
    time: 0.10,
    pose: {
      ...GUARD_POSE,
      leftHip: { x: -0.08, y: 0.11 },
      rightHip: { x: 0.12, y: 0.17 },
      rightKnee: { x: 0.18, y: 0.42 },
      rightAnkle: { x: 0.20, y: 0.65 },
    },
  },
  // Pivot, lift rear leg (knee comes forward)
  {
    time: 0.22,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.0, y: -0.40 },
      leftHip: { x: -0.10, y: 0.11 },
      rightHip: { x: 0.08, y: 0.16 },
      leftKnee: { x: -0.02, y: 0.30 },
      leftAnkle: { x: -0.02, y: 0.50 },
      rightKnee: { x: 0.10, y: 0.28 },
      rightAnkle: { x: 0.12, y: 0.48 },
    },
  },
  // Swing forward-diagonal - hip drives through
  {
    time: 0.35,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.02, y: -0.40 },
      leftHip: { x: -0.12, y: 0.10 },
      rightHip: { x: 0.05, y: 0.15 },
      leftKnee: { x: -0.04, y: 0.28 },
      leftAnkle: { x: -0.05, y: 0.48 },
      rightKnee: { x: 0.0, y: 0.25 },
      rightAnkle: { x: -0.02, y: 0.42 },
    },
  },
  // Mid swing - kick going FORWARD (lower Y = closer to viewer)
  {
    time: 0.48,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.04, y: -0.40 },
      leftHip: { x: -0.14, y: 0.10 },
      rightHip: { x: 0.04, y: 0.14 },
      leftKnee: { x: -0.05, y: 0.26 },
      leftAnkle: { x: -0.06, y: 0.46 },
      rightKnee: { x: -0.05, y: 0.22 },
      rightAnkle: { x: -0.12, y: 0.35 },
    },
  },
  // Impact - leg extends FORWARD toward viewer
  {
    time: 0.58,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.05, y: -0.40 },
      leftHip: { x: -0.15, y: 0.09 },
      rightHip: { x: 0.02, y: 0.13 },
      leftKnee: { x: -0.06, y: 0.25 },
      leftAnkle: { x: -0.07, y: 0.45 },
      rightKnee: { x: -0.08, y: 0.20 },
      rightAnkle: { x: -0.18, y: 0.30 },
    },
  },
  // Follow through
  {
    time: 0.68,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.03, y: -0.40 },
      leftHip: { x: -0.13, y: 0.10 },
      rightHip: { x: 0.05, y: 0.16 },
      rightKnee: { x: -0.02, y: 0.30 },
      rightAnkle: { x: -0.08, y: 0.45 },
    },
  },
  // Recovery
  {
    time: 0.80,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.0, y: -0.40 },
      leftHip: { x: -0.10, y: 0.10 },
      rightHip: { x: 0.10, y: 0.18 },
      rightKnee: { x: 0.08, y: 0.44 },
      rightAnkle: { x: 0.05, y: 0.62 },
    },
  },
  // Almost back
  {
    time: 0.92,
    pose: {
      ...GUARD_POSE,
      rightKnee: { x: 0.16, y: 0.45 },
      rightAnkle: { x: 0.18, y: 0.68 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// KNEE - Driving knee strike with rear leg
const createKneeKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Shift weight forward
  {
    time: 0.10,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.02, y: -0.41 },
      leftWrist: { x: -0.06, y: -0.26 },
      rightWrist: { x: 0.10, y: -0.28 },
      rightKnee: { x: 0.16, y: 0.42 },
      rightAnkle: { x: 0.18, y: 0.65 },
    },
  },
  // Begin knee lift, hands move to clinch position
  {
    time: 0.22,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.0, y: -0.42 },
      leftWrist: { x: -0.02, y: -0.22 },
      rightWrist: { x: 0.06, y: -0.22 },
      rightHip: { x: 0.12, y: 0.16 },
      rightKnee: { x: 0.10, y: 0.30 },
      rightAnkle: { x: 0.12, y: 0.52 },
    },
  },
  // Driving up - explosive
  {
    time: 0.35,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.02, y: -0.43 },
      leftWrist: { x: 0.0, y: -0.18 },
      rightWrist: { x: 0.04, y: -0.18 },
      rightHip: { x: 0.10, y: 0.14 },
      rightKnee: { x: 0.05, y: 0.12 },
      rightAnkle: { x: 0.08, y: 0.35 },
    },
  },
  // Peak - knee at highest point
  {
    time: 0.50,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.03, y: -0.44 },
      leftWrist: { x: 0.02, y: -0.12 },
      rightWrist: { x: 0.06, y: -0.12 },
      leftHip: { x: -0.08, y: 0.12 },
      rightHip: { x: 0.08, y: 0.12 },
      rightKnee: { x: 0.02, y: -0.02 },
      rightAnkle: { x: 0.06, y: 0.22 },
    },
  },
  // Begin descent
  {
    time: 0.62,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.01, y: -0.42 },
      leftWrist: { x: 0.0, y: -0.18 },
      rightWrist: { x: 0.06, y: -0.20 },
      rightHip: { x: 0.10, y: 0.14 },
      rightKnee: { x: 0.06, y: 0.15 },
      rightAnkle: { x: 0.10, y: 0.40 },
    },
  },
  // Lowering
  {
    time: 0.75,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.01, y: -0.41 },
      leftWrist: { x: -0.04, y: -0.24 },
      rightWrist: { x: 0.08, y: -0.26 },
      rightKnee: { x: 0.12, y: 0.35 },
      rightAnkle: { x: 0.14, y: 0.58 },
    },
  },
  // Almost back
  {
    time: 0.88,
    pose: {
      ...GUARD_POSE,
      rightKnee: { x: 0.16, y: 0.43 },
      rightAnkle: { x: 0.19, y: 0.68 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// ELBOW - Downward diagonal elbow strike
const createElbowKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Load - slight turn back
  {
    time: 0.10,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.04, y: -0.40 },
      rightShoulder: { x: 0.16, y: -0.19 },
      rightElbow: { x: 0.22, y: -0.08 },
      rightWrist: { x: 0.18, y: -0.25 },
    },
  },
  // Raise elbow high
  {
    time: 0.22,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.02, y: -0.40 },
      rightShoulder: { x: 0.12, y: -0.22 },
      rightElbow: { x: 0.18, y: -0.35 },
      rightWrist: { x: 0.12, y: -0.18 },
      leftHip: { x: -0.08, y: 0.11 },
    },
  },
  // Chamber - elbow at peak
  {
    time: 0.35,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.0, y: -0.40 },
      rightShoulder: { x: 0.10, y: -0.24 },
      rightElbow: { x: 0.15, y: -0.40 },
      rightWrist: { x: 0.08, y: -0.20 },
      leftHip: { x: -0.12, y: 0.11 },
    },
  },
  // Slash down - explosive
  {
    time: 0.48,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.03, y: -0.40 },
      rightShoulder: { x: 0.06, y: -0.25 },
      rightElbow: { x: -0.02, y: -0.32 },
      rightWrist: { x: -0.08, y: -0.15 },
      leftHip: { x: -0.15, y: 0.11 },
      rightHip: { x: 0.05, y: 0.19 },
    },
  },
  // Impact - elbow strikes through
  {
    time: 0.58,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.04, y: -0.40 },
      rightShoulder: { x: 0.04, y: -0.24 },
      rightElbow: { x: -0.12, y: -0.28 },
      rightWrist: { x: -0.10, y: -0.08 },
      leftHip: { x: -0.16, y: 0.11 },
      rightHip: { x: 0.04, y: 0.19 },
    },
  },
  // Follow through
  {
    time: 0.70,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.02, y: -0.40 },
      rightShoulder: { x: 0.08, y: -0.22 },
      rightElbow: { x: -0.05, y: -0.20 },
      rightWrist: { x: -0.02, y: -0.12 },
      leftHip: { x: -0.12, y: 0.11 },
      rightHip: { x: 0.08, y: 0.18 },
    },
  },
  // Recovery
  {
    time: 0.82,
    pose: {
      ...GUARD_POSE,
      rightShoulder: { x: 0.14, y: -0.19 },
      rightElbow: { x: 0.18, y: -0.08 },
      rightWrist: { x: 0.10, y: -0.22 },
    },
  },
  // Almost back
  {
    time: 0.92,
    pose: {
      ...GUARD_POSE,
      rightShoulder: { x: 0.17, y: -0.18 },
      rightElbow: { x: 0.23, y: -0.03 },
      rightWrist: { x: 0.12, y: -0.28 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// UPPERCUT (Mat Taeng) - Upward punch to chin with rear hand
const createUppercutKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Drop slightly, load legs
  {
    time: 0.12,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.04, y: -0.38 },
      rightShoulder: { x: 0.19, y: -0.16 },
      rightElbow: { x: 0.26, y: 0.02 },
      rightWrist: { x: 0.18, y: 0.08 },
      leftHip: { x: -0.05, y: 0.12 },
      rightHip: { x: 0.15, y: 0.20 },
      leftKnee: { x: 0.01, y: 0.34 },
      rightKnee: { x: 0.19, y: 0.48 },
    },
  },
  // Begin rising with fist
  {
    time: 0.25,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.02, y: -0.39 },
      rightShoulder: { x: 0.16, y: -0.18 },
      rightElbow: { x: 0.20, y: -0.02 },
      rightWrist: { x: 0.10, y: -0.05 },
      leftHip: { x: -0.07, y: 0.11 },
      rightHip: { x: 0.13, y: 0.18 },
    },
  },
  // Driving upward
  {
    time: 0.38,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.0, y: -0.40 },
      rightShoulder: { x: 0.12, y: -0.20 },
      rightElbow: { x: 0.08, y: -0.10 },
      rightWrist: { x: 0.02, y: -0.18 },
      leftHip: { x: -0.10, y: 0.10 },
      rightHip: { x: 0.10, y: 0.17 },
    },
  },
  // Full extension - IMPACT at chin level
  {
    time: 0.50,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.02, y: -0.41 },
      rightShoulder: { x: 0.08, y: -0.22 },
      rightElbow: { x: 0.0, y: -0.18 },
      rightWrist: { x: -0.05, y: -0.35 },
      leftHip: { x: -0.12, y: 0.10 },
      rightHip: { x: 0.08, y: 0.16 },
      rightAnkle: { x: 0.18, y: 0.68 },
    },
  },
  // Begin retraction
  {
    time: 0.62,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.0, y: -0.40 },
      rightShoulder: { x: 0.12, y: -0.20 },
      rightElbow: { x: 0.10, y: -0.12 },
      rightWrist: { x: 0.05, y: -0.22 },
      leftHip: { x: -0.08, y: 0.11 },
      rightHip: { x: 0.12, y: 0.18 },
    },
  },
  // Mid recovery
  {
    time: 0.75,
    pose: {
      ...GUARD_POSE,
      rightShoulder: { x: 0.16, y: -0.18 },
      rightElbow: { x: 0.22, y: -0.04 },
      rightWrist: { x: 0.12, y: -0.26 },
    },
  },
  // Almost back
  {
    time: 0.88,
    pose: {
      ...GUARD_POSE,
      rightShoulder: { x: 0.17, y: -0.18 },
      rightElbow: { x: 0.24, y: -0.02 },
      rightWrist: { x: 0.12, y: -0.29 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// ROUNDHOUSE KICK (Te Tat) - Circular kick to body/head with rear leg
const createRoundhouseKeyframes = (): AvatarKeyframe[] => [
  { time: 0, pose: GUARD_POSE },
  // Step and pivot on lead foot
  {
    time: 0.10,
    pose: {
      ...GUARD_POSE,
      head: { x: 0.0, y: -0.40 },
      leftHip: { x: -0.08, y: 0.11 },
      rightHip: { x: 0.12, y: 0.16 },
      leftKnee: { x: -0.02, y: 0.30 },
      rightKnee: { x: 0.15, y: 0.42 },
      leftAnkle: { x: 0.0, y: 0.50 },
      rightAnkle: { x: 0.18, y: 0.65 },
    },
  },
  // Chamber - lift kicking leg
  {
    time: 0.22,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.05, y: -0.40 },
      leftShoulder: { x: -0.15, y: -0.20 },
      rightShoulder: { x: 0.12, y: -0.20 },
      leftHip: { x: -0.12, y: 0.08 },
      rightHip: { x: 0.08, y: 0.12 },
      leftKnee: { x: -0.05, y: 0.28 },
      rightKnee: { x: 0.12, y: 0.25 },
      leftAnkle: { x: -0.02, y: 0.48 },
      rightAnkle: { x: 0.20, y: 0.38 },
    },
  },
  // Swing begins - hip rotation
  {
    time: 0.35,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.08, y: -0.40 },
      leftShoulder: { x: -0.18, y: -0.18 },
      rightShoulder: { x: 0.08, y: -0.22 },
      leftElbow: { x: -0.25, y: -0.05 },
      rightElbow: { x: 0.15, y: -0.08 },
      leftWrist: { x: -0.20, y: -0.22 },
      rightWrist: { x: 0.08, y: -0.26 },
      leftHip: { x: -0.15, y: 0.06 },
      rightHip: { x: 0.05, y: 0.10 },
      leftKnee: { x: -0.08, y: 0.26 },
      rightKnee: { x: 0.0, y: 0.12 },
      leftAnkle: { x: -0.05, y: 0.46 },
      rightAnkle: { x: 0.12, y: 0.18 },
    },
  },
  // Full extension - IMPACT at body/head height
  {
    time: 0.48,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.10, y: -0.40 },
      leftShoulder: { x: -0.20, y: -0.16 },
      rightShoulder: { x: 0.05, y: -0.24 },
      leftElbow: { x: -0.28, y: -0.02 },
      rightElbow: { x: 0.12, y: -0.10 },
      leftWrist: { x: -0.22, y: -0.20 },
      rightWrist: { x: 0.05, y: -0.28 },
      leftHip: { x: -0.18, y: 0.05 },
      rightHip: { x: 0.02, y: 0.08 },
      leftKnee: { x: -0.10, y: 0.24 },
      rightKnee: { x: -0.15, y: 0.02 },
      leftAnkle: { x: -0.08, y: 0.44 },
      rightAnkle: { x: -0.05, y: -0.08 },
    },
  },
  // Follow through
  {
    time: 0.58,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.08, y: -0.40 },
      leftShoulder: { x: -0.18, y: -0.18 },
      rightShoulder: { x: 0.08, y: -0.22 },
      leftHip: { x: -0.16, y: 0.06 },
      rightHip: { x: 0.04, y: 0.10 },
      leftKnee: { x: -0.08, y: 0.26 },
      rightKnee: { x: -0.08, y: 0.08 },
      leftAnkle: { x: -0.06, y: 0.46 },
      rightAnkle: { x: 0.05, y: 0.12 },
    },
  },
  // Retract kick
  {
    time: 0.70,
    pose: {
      ...GUARD_POSE,
      head: { x: -0.05, y: -0.40 },
      leftHip: { x: -0.12, y: 0.08 },
      rightHip: { x: 0.08, y: 0.14 },
      leftKnee: { x: -0.05, y: 0.28 },
      rightKnee: { x: 0.10, y: 0.30 },
      leftAnkle: { x: -0.02, y: 0.48 },
      rightAnkle: { x: 0.15, y: 0.45 },
    },
  },
  // Return to stance
  {
    time: 0.85,
    pose: {
      ...GUARD_POSE,
      leftKnee: { x: 0.0, y: 0.31 },
      rightKnee: { x: 0.17, y: 0.44 },
      leftAnkle: { x: 0.01, y: 0.51 },
      rightAnkle: { x: 0.20, y: 0.68 },
    },
  },
  { time: 1, pose: GUARD_POSE },
];

// ============================================
// Helper to mirror keyframes (swap left/right)
// ============================================
function mirrorKeyframes(keyframes: AvatarKeyframe[]): AvatarKeyframe[] {
  return keyframes.map((kf) => ({
    time: kf.time,
    pose: {
      head: kf.pose.head,
      // Swap shoulders
      leftShoulder: kf.pose.rightShoulder,
      rightShoulder: kf.pose.leftShoulder,
      // Swap elbows
      leftElbow: kf.pose.rightElbow,
      rightElbow: kf.pose.leftElbow,
      // Swap wrists
      leftWrist: kf.pose.rightWrist,
      rightWrist: kf.pose.leftWrist,
      // Swap hips
      leftHip: kf.pose.rightHip,
      rightHip: kf.pose.leftHip,
      // Swap knees
      leftKnee: kf.pose.rightKnee,
      rightKnee: kf.pose.leftKnee,
      // Swap ankles
      leftAnkle: kf.pose.rightAnkle,
      rightAnkle: kf.pose.leftAnkle,
    },
  }));
}

// ============================================
// Moves Database
// ============================================
export const MOVES: Record<string, Move> = {
  jab: {
    id: 'jab',
    nameKey: 'moves.jab',
    type: 'punch',
    side: 'lead', // Lead hand (left for orthodox)
    cueKeys: ['cues.jab.extend', 'cues.jab.snap', 'cues.jab.return'],
    keyframes: createJabKeyframes(),
    duration: 400,
  },
  cross: {
    id: 'cross',
    nameKey: 'moves.cross',
    type: 'punch',
    side: 'rear', // Rear hand (right for orthodox)
    cueKeys: ['cues.cross.rotate', 'cues.cross.extend', 'cues.cross.power'],
    keyframes: createCrossKeyframes(),
    duration: 500,
  },
  hook: {
    id: 'hook',
    nameKey: 'moves.hook',
    type: 'punch',
    side: 'lead', // Lead hand (left for orthodox)
    cueKeys: ['cues.hook.elbow', 'cues.hook.rotate', 'cues.hook.compact'],
    keyframes: createHookKeyframes(),
    duration: 450,
  },
  uppercut: {
    id: 'uppercut',
    nameKey: 'moves.uppercut',
    type: 'punch',
    side: 'rear', // Rear hand (right for orthodox)
    cueKeys: ['cues.uppercut.drop', 'cues.uppercut.drive', 'cues.uppercut.chin'],
    keyframes: createUppercutKeyframes(),
    duration: 450,
  },
  teep: {
    id: 'teep',
    nameKey: 'moves.teep',
    type: 'kick',
    side: 'lead', // Lead leg (left for orthodox)
    cueKeys: ['cues.teep.chamber', 'cues.teep.push', 'cues.teep.retract'],
    keyframes: createTeepKeyframes(),
    duration: 600,
  },
  lowKick: {
    id: 'lowKick',
    nameKey: 'moves.lowKick',
    type: 'kick',
    side: 'rear', // Rear leg (right for orthodox)
    cueKeys: ['cues.lowKick.step', 'cues.lowKick.shin', 'cues.lowKick.through'],
    keyframes: createLowKickKeyframes(),
    duration: 650,
  },
  roundhouse: {
    id: 'roundhouse',
    nameKey: 'moves.roundhouse',
    type: 'kick',
    side: 'rear', // Rear leg (right for orthodox)
    cueKeys: ['cues.roundhouse.pivot', 'cues.roundhouse.hips', 'cues.roundhouse.shin'],
    keyframes: createRoundhouseKeyframes(),
    duration: 700,
  },
  knee: {
    id: 'knee',
    nameKey: 'moves.knee',
    type: 'knee',
    side: 'rear', // Rear leg (right for orthodox)
    cueKeys: ['cues.knee.drive', 'cues.knee.hips', 'cues.knee.pull'],
    keyframes: createKneeKeyframes(),
    duration: 500,
  },
  elbow: {
    id: 'elbow',
    nameKey: 'moves.elbow',
    type: 'elbow',
    side: 'rear', // Rear arm (right for orthodox)
    cueKeys: ['cues.elbow.raise', 'cues.elbow.slash', 'cues.elbow.point'],
    keyframes: createElbowKeyframes(),
    duration: 400,
  },
  // Lead versions (mirrored)
  leadLowKick: {
    id: 'leadLowKick',
    nameKey: 'moves.leadLowKick',
    type: 'kick',
    side: 'lead', // Lead leg (left for orthodox)
    cueKeys: ['cues.lowKick.step', 'cues.lowKick.shin', 'cues.lowKick.through'],
    keyframes: mirrorKeyframes(createLowKickKeyframes()),
    duration: 650,
  },
  leadRoundhouse: {
    id: 'leadRoundhouse',
    nameKey: 'moves.leadRoundhouse',
    type: 'kick',
    side: 'lead', // Lead leg (left for orthodox)
    cueKeys: ['cues.roundhouse.pivot', 'cues.roundhouse.hips', 'cues.roundhouse.shin'],
    keyframes: mirrorKeyframes(createRoundhouseKeyframes()),
    duration: 700,
  },
  leadKnee: {
    id: 'leadKnee',
    nameKey: 'moves.leadKnee',
    type: 'knee',
    side: 'lead', // Lead leg (left for orthodox)
    cueKeys: ['cues.knee.drive', 'cues.knee.hips', 'cues.knee.pull'],
    keyframes: mirrorKeyframes(createKneeKeyframes()),
    duration: 500,
  },
  leadElbow: {
    id: 'leadElbow',
    nameKey: 'moves.leadElbow',
    type: 'elbow',
    side: 'lead', // Lead arm (left for orthodox)
    cueKeys: ['cues.elbow.raise', 'cues.elbow.slash', 'cues.elbow.point'],
    keyframes: mirrorKeyframes(createElbowKeyframes()),
    duration: 400,
  },
  rearTeep: {
    id: 'rearTeep',
    nameKey: 'moves.rearTeep',
    type: 'kick',
    side: 'rear', // Rear leg (right for orthodox)
    cueKeys: ['cues.teep.chamber', 'cues.teep.push', 'cues.teep.retract'],
    keyframes: mirrorKeyframes(createTeepKeyframes()),
    duration: 600,
  },
  rearHook: {
    id: 'rearHook',
    nameKey: 'moves.rearHook',
    type: 'punch',
    side: 'rear', // Rear hand (right for orthodox)
    cueKeys: ['cues.hook.elbow', 'cues.hook.rotate', 'cues.hook.compact'],
    keyframes: mirrorKeyframes(createHookKeyframes()),
    duration: 450,
  },
  leadUppercut: {
    id: 'leadUppercut',
    nameKey: 'moves.leadUppercut',
    type: 'punch',
    side: 'lead', // Lead hand (left for orthodox)
    cueKeys: ['cues.uppercut.drop', 'cues.uppercut.drive', 'cues.uppercut.chin'],
    keyframes: mirrorKeyframes(createUppercutKeyframes()),
    duration: 450,
  },
};

// ============================================
// Combos Database
// ============================================
export const COMBOS: Combo[] = [
  // Level 1 - Beginner (uses training settings: level1DurationSec)
  {
    id: 'l1-jab-cross',
    level: 1,
    nameKey: 'combos.jabCross',
    moveIds: ['jab', 'cross'],
    tipKeys: ['tips.keepGuard', 'tips.breathe'],
  },
  {
    id: 'l1-double-jab',
    level: 1,
    nameKey: 'combos.doubleJab',
    moveIds: ['jab', 'jab'],
    tipKeys: ['tips.rhythm', 'tips.relaxed'],
  },
  {
    id: 'l1-jab-teep',
    level: 1,
    nameKey: 'combos.jabTeep',
    moveIds: ['jab', 'teep'],
    tipKeys: ['tips.distance', 'tips.balance'],
  },
  {
    id: 'l1-cross-hook',
    level: 1,
    nameKey: 'combos.crossHook',
    moveIds: ['cross', 'hook'],
    tipKeys: ['tips.rotation', 'tips.power'],
  },
  {
    id: 'l1-teep-teep',
    level: 1,
    nameKey: 'combos.doubleTeep',
    moveIds: ['teep', 'teep'],
    tipKeys: ['tips.distance', 'tips.rhythm'],
  },
  {
    id: 'l1-jab-hook',
    level: 1,
    nameKey: 'combos.jabHook',
    moveIds: ['jab', 'hook'],
    tipKeys: ['tips.angle', 'tips.relaxed'],
  },
  // Level 2 - Intermediate (uses training settings: level2DurationSec)
  {
    id: 'l2-jab-cross-hook',
    level: 2,
    nameKey: 'combos.jabCrossHook',
    moveIds: ['jab', 'cross', 'hook'],
    tipKeys: ['tips.flow', 'tips.rotation'],
  },
  {
    id: 'l2-jab-low-kick',
    level: 2,
    nameKey: 'combos.jabLowKick',
    moveIds: ['jab', 'jab', 'lowKick'],
    tipKeys: ['tips.setup', 'tips.commitment'],
  },
  {
    id: 'l2-teep-cross',
    level: 2,
    nameKey: 'combos.teepCross',
    moveIds: ['teep', 'cross', 'hook'],
    tipKeys: ['tips.range', 'tips.follow'],
  },
  {
    id: 'l2-jab-cross-lowkick',
    level: 2,
    nameKey: 'combos.jabCrossLowKick',
    moveIds: ['jab', 'cross', 'lowKick'],
    tipKeys: ['tips.setup', 'tips.power'],
  },
  {
    id: 'l2-hook-cross-hook',
    level: 2,
    nameKey: 'combos.hookCrossHook',
    moveIds: ['hook', 'cross', 'hook'],
    tipKeys: ['tips.rotation', 'tips.flow'],
  },
  {
    id: 'l2-teep-lowkick',
    level: 2,
    nameKey: 'combos.teepLowKick',
    moveIds: ['teep', 'lowKick'],
    tipKeys: ['tips.distance', 'tips.commitment'],
  },
  // Level 3 - Advanced (uses training settings: level3DurationSec)
  {
    id: 'l3-full-combo',
    level: 3,
    nameKey: 'combos.fullCombo',
    moveIds: ['jab', 'cross', 'hook', 'lowKick'],
    tipKeys: ['tips.chain', 'tips.power'],
  },
  {
    id: 'l3-clinch-combo',
    level: 3,
    nameKey: 'combos.clinchCombo',
    moveIds: ['jab', 'cross', 'knee', 'elbow'],
    tipKeys: ['tips.close', 'tips.devastating'],
  },
  {
    id: 'l3-destroyer',
    level: 3,
    nameKey: 'combos.destroyer',
    moveIds: ['jab', 'cross', 'hook', 'lowKick', 'knee', 'elbow'],
    tipKeys: ['tips.ultimate', 'tips.warrior'],
  },
  {
    id: 'l3-thai-classic',
    level: 3,
    nameKey: 'combos.thaiClassic',
    moveIds: ['teep', 'jab', 'cross', 'lowKick', 'knee'],
    tipKeys: ['tips.authentic', 'tips.flow'],
  },
  {
    id: 'l3-boxing-kicks',
    level: 3,
    nameKey: 'combos.boxingKicks',
    moveIds: ['jab', 'jab', 'cross', 'hook', 'lowKick'],
    tipKeys: ['tips.setup', 'tips.devastating'],
  },
  {
    id: 'l3-elbow-fury',
    level: 3,
    nameKey: 'combos.elbowFury',
    moveIds: ['jab', 'cross', 'elbow', 'knee', 'elbow'],
    tipKeys: ['tips.close', 'tips.warrior'],
  },
];

// ============================================
// Helper Functions
// ============================================
export function getComboById(id: string): Combo | undefined {
  return COMBOS.find((c) => c.id === id);
}

export function getCombosByLevel(level: 1 | 2 | 3): Combo[] {
  return COMBOS.filter((c) => c.level === level);
}

export function getMoveById(id: string): Move | undefined {
  return MOVES[id];
}

export function getComboMoves(combo: Combo): Move[] {
  return combo.moveIds.map((id) => MOVES[id]).filter(Boolean);
}

export function getComboTotalDuration(combo: Combo): number {
  return getComboMoves(combo).reduce((sum, move) => sum + move.duration, 0);
}

export { GUARD_POSE };

