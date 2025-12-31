// ============================================
// Stickman Avatar Animation Helpers
// ============================================

import type { AvatarPose, AvatarKeyframe, Point2D } from './types';
import { GUARD_POSE, MOVES } from './combos';

/**
 * Interpolate between two points
 */
function lerpPoint(a: Point2D, b: Point2D, t: number): Point2D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Interpolate between two poses
 */
export function lerpPose(a: AvatarPose, b: AvatarPose, t: number): AvatarPose {
  return {
    head: lerpPoint(a.head, b.head, t),
    leftShoulder: lerpPoint(a.leftShoulder, b.leftShoulder, t),
    rightShoulder: lerpPoint(a.rightShoulder, b.rightShoulder, t),
    leftElbow: lerpPoint(a.leftElbow, b.leftElbow, t),
    rightElbow: lerpPoint(a.rightElbow, b.rightElbow, t),
    leftWrist: lerpPoint(a.leftWrist, b.leftWrist, t),
    rightWrist: lerpPoint(a.rightWrist, b.rightWrist, t),
    leftHip: lerpPoint(a.leftHip, b.leftHip, t),
    rightHip: lerpPoint(a.rightHip, b.rightHip, t),
    leftKnee: lerpPoint(a.leftKnee, b.leftKnee, t),
    rightKnee: lerpPoint(a.rightKnee, b.rightKnee, t),
    leftAnkle: lerpPoint(a.leftAnkle, b.leftAnkle, t),
    rightAnkle: lerpPoint(a.rightAnkle, b.rightAnkle, t),
  };
}

/**
 * Get pose at a specific progress point from keyframes
 */
export function getPoseAtProgress(
  keyframes: AvatarKeyframe[],
  progress: number
): AvatarPose {
  if (keyframes.length === 0) {
    return GUARD_POSE;
  }

  if (keyframes.length === 1) {
    return keyframes[0].pose;
  }

  // Clamp progress
  const t = Math.max(0, Math.min(1, progress));

  // Find surrounding keyframes
  let prevFrame = keyframes[0];
  let nextFrame = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (keyframes[i].time <= t && keyframes[i + 1].time >= t) {
      prevFrame = keyframes[i];
      nextFrame = keyframes[i + 1];
      break;
    }
  }

  // Calculate local progress between keyframes
  const keyframeDuration = nextFrame.time - prevFrame.time;
  if (keyframeDuration === 0) {
    return prevFrame.pose;
  }

  const localProgress = (t - prevFrame.time) / keyframeDuration;

  // Apply easing (ease-in-out)
  const easedProgress = easeInOutCubic(localProgress);

  return lerpPose(prevFrame.pose, nextFrame.pose, easedProgress);
}

/**
 * Ease-in-out cubic function
 */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Generate keyframes for a combo sequence
 */
export function generateComboKeyframes(
  moveIds: string[],
  _totalDurationMs: number
): AvatarKeyframe[] {
  const keyframes: AvatarKeyframe[] = [];
  const moveCount = moveIds.length;
  // Give 90% of time to moves, 10% for final return to guard
  const moveSlotDuration = 0.9 / moveCount;

  // Start in guard
  keyframes.push({ time: 0, pose: GUARD_POSE });

  // Add each move's keyframes
  for (let i = 0; i < moveIds.length; i++) {
    const move = MOVES[moveIds[i]];
    if (!move) continue;

    const moveStartTime = i * moveSlotDuration + 0.02; // Small pause between moves
    const moveDuration = moveSlotDuration * 0.9; // 90% of slot for move

    // Add move keyframes, scaled to fit
    for (const kf of move.keyframes) {
      // Skip the initial guard pose if it's not the first move
      if (i > 0 && kf.time === 0) continue;
      
      const time = moveStartTime + kf.time * moveDuration;
      if (time <= 0.95) {
        keyframes.push({ time, pose: kf.pose });
      }
    }
  }

  // End in guard
  keyframes.push({ time: 1, pose: GUARD_POSE });

  // Sort by time and remove duplicates at same time
  keyframes.sort((a, b) => a.time - b.time);

  return keyframes;
}

/**
 * Mirror a pose for southpaw stance
 */
export function mirrorPose(pose: AvatarPose): AvatarPose {
  return {
    head: { x: -pose.head.x, y: pose.head.y },
    leftShoulder: { x: -pose.rightShoulder.x, y: pose.rightShoulder.y },
    rightShoulder: { x: -pose.leftShoulder.x, y: pose.leftShoulder.y },
    leftElbow: { x: -pose.rightElbow.x, y: pose.rightElbow.y },
    rightElbow: { x: -pose.leftElbow.x, y: pose.leftElbow.y },
    leftWrist: { x: -pose.rightWrist.x, y: pose.rightWrist.y },
    rightWrist: { x: -pose.leftWrist.x, y: pose.leftWrist.y },
    leftHip: { x: -pose.rightHip.x, y: pose.rightHip.y },
    rightHip: { x: -pose.leftHip.x, y: pose.leftHip.y },
    leftKnee: { x: -pose.rightKnee.x, y: pose.rightKnee.y },
    rightKnee: { x: -pose.leftKnee.x, y: pose.leftKnee.y },
    leftAnkle: { x: -pose.rightAnkle.x, y: pose.rightAnkle.y },
    rightAnkle: { x: -pose.leftAnkle.x, y: pose.leftAnkle.y },
  };
}

/**
 * Convert pose coordinates to canvas coordinates
 */
export function poseToCanvas(
  pose: AvatarPose,
  canvasWidth: number,
  canvasHeight: number,
  scale: number = 0.8
): AvatarPose {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const scaleFactor = Math.min(canvasWidth, canvasHeight) * scale;

  const transform = (point: Point2D): Point2D => ({
    x: centerX + point.x * scaleFactor,
    y: centerY + point.y * scaleFactor,
  });

  return {
    head: transform(pose.head),
    leftShoulder: transform(pose.leftShoulder),
    rightShoulder: transform(pose.rightShoulder),
    leftElbow: transform(pose.leftElbow),
    rightElbow: transform(pose.rightElbow),
    leftWrist: transform(pose.leftWrist),
    rightWrist: transform(pose.rightWrist),
    leftHip: transform(pose.leftHip),
    rightHip: transform(pose.rightHip),
    leftKnee: transform(pose.leftKnee),
    rightKnee: transform(pose.rightKnee),
    leftAnkle: transform(pose.leftAnkle),
    rightAnkle: transform(pose.rightAnkle),
  };
}

/**
 * Draw a limb as a tapered capsule (more realistic than a line)
 */
function drawLimb(
  ctx: CanvasRenderingContext2D,
  start: Point2D,
  end: Point2D,
  startWidth: number,
  endWidth: number,
  color: string,
  shadowColor?: string
): void {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const perpAngle = angle + Math.PI / 2;

  // Calculate the 4 corners of the tapered shape
  const p1 = {
    x: start.x + Math.cos(perpAngle) * startWidth,
    y: start.y + Math.sin(perpAngle) * startWidth,
  };
  const p2 = {
    x: start.x - Math.cos(perpAngle) * startWidth,
    y: start.y - Math.sin(perpAngle) * startWidth,
  };
  const p3 = {
    x: end.x - Math.cos(perpAngle) * endWidth,
    y: end.y - Math.sin(perpAngle) * endWidth,
  };
  const p4 = {
    x: end.x + Math.cos(perpAngle) * endWidth,
    y: end.y + Math.sin(perpAngle) * endWidth,
  };

  // Draw shadow first if provided
  if (shadowColor) {
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(p1.x + 2, p1.y + 2);
    ctx.lineTo(p2.x + 2, p2.y + 2);
    ctx.lineTo(p3.x + 2, p3.y + 2);
    ctx.lineTo(p4.x + 2, p4.y + 2);
    ctx.closePath();
    ctx.fill();
  }

  // Draw the limb shape
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();

  // Draw rounded caps
  ctx.beginPath();
  ctx.arc(start.x, start.y, startWidth, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(end.x, end.y, endWidth, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a torso shape (trapezoid with rounded corners)
 */
function drawTorso(
  ctx: CanvasRenderingContext2D,
  leftShoulder: Point2D,
  rightShoulder: Point2D,
  leftHip: Point2D,
  rightHip: Point2D,
  color: string,
  shadowColor?: string
): void {
  const expand = 3;

  if (shadowColor) {
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(leftShoulder.x - expand + 2, leftShoulder.y + 2);
    ctx.lineTo(rightShoulder.x + expand + 2, rightShoulder.y + 2);
    ctx.lineTo(rightHip.x + expand * 0.7 + 2, rightHip.y + 2);
    ctx.lineTo(leftHip.x - expand * 0.7 + 2, leftHip.y + 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(leftShoulder.x - expand, leftShoulder.y);
  ctx.lineTo(rightShoulder.x + expand, rightShoulder.y);
  ctx.lineTo(rightHip.x + expand * 0.7, rightHip.y);
  ctx.lineTo(leftHip.x - expand * 0.7, leftHip.y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a boxing glove shape
 */
function drawGlove(
  ctx: CanvasRenderingContext2D,
  position: Point2D,
  radius: number,
  color: string,
  isRear: boolean
): void {
  const scale = isRear ? 0.85 : 1;
  const r = radius * scale;
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(position.x, position.y, r * 1.2, r, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Thumb bump
  ctx.beginPath();
  ctx.arc(position.x - r * 0.6, position.y - r * 0.3, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(position.x - r * 0.3, position.y - r * 0.3, r * 0.4, r * 0.25, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a foot shape
 */
function drawFoot(
  ctx: CanvasRenderingContext2D,
  position: Point2D,
  size: number,
  direction: number,
  color: string,
  isRear: boolean
): void {
  const scale = isRear ? 0.85 : 1;
  const w = size * 2 * scale;
  const h = size * 0.8 * scale;
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(
    position.x + direction * w * 0.3, 
    position.y, 
    w, 
    h, 
    0, 
    0, 
    Math.PI * 2
  );
  ctx.fill();
}

/**
 * Draw a realistic fighter figure on canvas with 3D perspective
 */
export function drawStickman(
  ctx: CanvasRenderingContext2D,
  pose: AvatarPose,
  options: {
    lineColor?: string;
    jointColor?: string;
    headColor?: string;
    lineWidth?: number;
    jointRadius?: number;
    headRadius?: number;
    gloves?: boolean;
    gloveColor?: string;
  } = {}
): void {
  const {
    lineColor = '#ef4444',
    headColor = '#fde047',
    jointRadius = 6,
    headRadius = 18,
    gloves = false,
    gloveColor = '#dc2626',
  } = options;

  // Colors
  const skinColor = '#f5d0c5';
  const skinColorDark = '#d4a99a';
  const skinColorLight = '#fce4dc';
  const shadowColor = 'rgba(0,0,0,0.2)';
  const shortsColor = lineColor;
  const shirtColor = '#1a1a2e';
  
  // Limb widths (slightly smaller for better proportions)
  const thighWidth = jointRadius * 1.3;
  const calfWidth = jointRadius * 1.0;
  const upperArmWidth = jointRadius * 1.1;
  const forearmWidth = jointRadius * 0.8;

  // Determine which leg/arm is forward based on position
  const leftLegForward = pose.leftAnkle.y < pose.rightAnkle.y;
  const faceDirection = leftLegForward ? -1 : 1;
  
  // For arms, check if wrist is extended forward (lower y or more central x means forward)
  const leftWristExtended = pose.leftWrist.y < pose.leftShoulder.y - 0.05 || 
                            Math.abs(pose.leftWrist.x) > Math.abs(pose.leftShoulder.x) + 0.1;
  const rightWristExtended = pose.rightWrist.y < pose.rightShoulder.y - 0.05 || 
                             Math.abs(pose.rightWrist.x) > Math.abs(pose.rightShoulder.x) + 0.1;
  const leftArmForward = leftWristExtended && !rightWristExtended ? true :
                         rightWristExtended && !leftWristExtended ? false :
                         pose.leftWrist.y < pose.rightWrist.y;

  // ===== 1. REAR LEG (furthest from viewer) =====
  if (leftLegForward) {
    drawLimb(ctx, pose.rightHip, pose.rightKnee, thighWidth * 0.75, calfWidth * 0.75, skinColorDark, shadowColor);
    drawLimb(ctx, pose.rightKnee, pose.rightAnkle, calfWidth * 0.75, jointRadius * 0.6, skinColorDark);
    drawFoot(ctx, pose.rightAnkle, jointRadius * 0.8, faceDirection, skinColorDark, true);
  } else {
    drawLimb(ctx, pose.leftHip, pose.leftKnee, thighWidth * 0.75, calfWidth * 0.75, skinColorDark, shadowColor);
    drawLimb(ctx, pose.leftKnee, pose.leftAnkle, calfWidth * 0.75, jointRadius * 0.6, skinColorDark);
    drawFoot(ctx, pose.leftAnkle, jointRadius * 0.8, faceDirection, skinColorDark, true);
  }

  // ===== 2. REAR ARM =====
  if (leftArmForward) {
    drawLimb(ctx, pose.rightShoulder, pose.rightElbow, upperArmWidth * 0.75, forearmWidth * 0.75, skinColorDark);
    drawLimb(ctx, pose.rightElbow, pose.rightWrist, forearmWidth * 0.75, jointRadius * 0.5, skinColorDark);
    if (gloves) {
      drawGlove(ctx, pose.rightWrist, jointRadius * 1.5, gloveColor + 'aa', true);
    } else {
      ctx.fillStyle = skinColorDark;
      ctx.beginPath();
      ctx.arc(pose.rightWrist.x, pose.rightWrist.y, jointRadius * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    drawLimb(ctx, pose.leftShoulder, pose.leftElbow, upperArmWidth * 0.75, forearmWidth * 0.75, skinColorDark);
    drawLimb(ctx, pose.leftElbow, pose.leftWrist, forearmWidth * 0.75, jointRadius * 0.5, skinColorDark);
    if (gloves) {
      drawGlove(ctx, pose.leftWrist, jointRadius * 1.5, gloveColor + 'aa', true);
    } else {
      ctx.fillStyle = skinColorDark;
      ctx.beginPath();
      ctx.arc(pose.leftWrist.x, pose.leftWrist.y, jointRadius * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ===== 3. TORSO =====
  drawTorso(ctx, pose.leftShoulder, pose.rightShoulder, pose.leftHip, pose.rightHip, shirtColor, shadowColor);
  
  // Shorts
  const shortsTop = {
    left: { x: pose.leftHip.x - 4, y: pose.leftHip.y - 3 },
    right: { x: pose.rightHip.x + 4, y: pose.rightHip.y - 3 },
  };
  const shortsBottom = {
    left: { x: (pose.leftHip.x + pose.leftKnee.x) / 2, y: (pose.leftHip.y + pose.leftKnee.y) / 2 },
    right: { x: (pose.rightHip.x + pose.rightKnee.x) / 2, y: (pose.rightHip.y + pose.rightKnee.y) / 2 },
  };
  ctx.fillStyle = shortsColor;
  ctx.beginPath();
  ctx.moveTo(shortsTop.left.x, shortsTop.left.y);
  ctx.lineTo(shortsTop.right.x, shortsTop.right.y);
  ctx.lineTo(shortsBottom.right.x, shortsBottom.right.y);
  ctx.lineTo(shortsBottom.left.x, shortsBottom.left.y);
  ctx.closePath();
  ctx.fill();

  // ===== 4. NECK AND HEAD (before front limbs so punches appear in front) =====
  const neckTop = {
    x: (pose.leftShoulder.x + pose.rightShoulder.x) / 2,
    y: (pose.leftShoulder.y + pose.rightShoulder.y) / 2,
  };
  
  // Smaller neck
  drawLimb(ctx, pose.head, neckTop, headRadius * 0.22, headRadius * 0.25, skinColor);

  // Head shadow
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(pose.head.x + 2, pose.head.y + 2, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Head base
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(pose.head.x, pose.head.y, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#2d2d2d';
  ctx.beginPath();
  ctx.arc(pose.head.x, pose.head.y - headRadius * 0.15, headRadius * 0.92, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();

  // Face side shading for 3D effect
  ctx.fillStyle = skinColorLight;
  ctx.beginPath();
  ctx.ellipse(
    pose.head.x + faceDirection * headRadius * 0.15,
    pose.head.y + headRadius * 0.1,
    headRadius * 0.5,
    headRadius * 0.65,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Ear
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.ellipse(
    pose.head.x + faceDirection * headRadius * 0.85,
    pose.head.y,
    headRadius * 0.15,
    headRadius * 0.25,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Eye
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(
    pose.head.x + faceDirection * headRadius * 0.3,
    pose.head.y - headRadius * 0.1,
    headRadius * 0.1,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Eyebrow
  ctx.strokeStyle = '#2d2d2d';
  ctx.lineWidth = headRadius * 0.07;
  ctx.beginPath();
  ctx.moveTo(
    pose.head.x + faceDirection * headRadius * 0.12,
    pose.head.y - headRadius * 0.28
  );
  ctx.lineTo(
    pose.head.x + faceDirection * headRadius * 0.48,
    pose.head.y - headRadius * 0.32
  );
  ctx.stroke();

  // Nose
  ctx.fillStyle = skinColorDark;
  ctx.beginPath();
  ctx.ellipse(
    pose.head.x + faceDirection * headRadius * 0.45,
    pose.head.y + headRadius * 0.08,
    headRadius * 0.08,
    headRadius * 0.12,
    faceDirection * 0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // ===== 5. FRONT LEG =====
  if (leftLegForward) {
    drawLimb(ctx, pose.leftHip, pose.leftKnee, thighWidth, calfWidth, skinColor, shadowColor);
    drawLimb(ctx, pose.leftKnee, pose.leftAnkle, calfWidth, jointRadius * 0.7, skinColor);
    drawFoot(ctx, pose.leftAnkle, jointRadius, faceDirection, skinColor, false);
  } else {
    drawLimb(ctx, pose.rightHip, pose.rightKnee, thighWidth, calfWidth, skinColor, shadowColor);
    drawLimb(ctx, pose.rightKnee, pose.rightAnkle, calfWidth, jointRadius * 0.7, skinColor);
    drawFoot(ctx, pose.rightAnkle, jointRadius, faceDirection, skinColor, false);
  }

  // ===== 6. FRONT ARM (last so punches are always visible in front) =====
  if (leftArmForward) {
    drawLimb(ctx, pose.leftShoulder, pose.leftElbow, upperArmWidth, forearmWidth, skinColor, shadowColor);
    drawLimb(ctx, pose.leftElbow, pose.leftWrist, forearmWidth, jointRadius * 0.6, skinColorLight);
    if (gloves) {
      drawGlove(ctx, pose.leftWrist, jointRadius * 1.8, gloveColor, false);
    } else {
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(pose.leftWrist.x, pose.leftWrist.y, jointRadius * 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    drawLimb(ctx, pose.rightShoulder, pose.rightElbow, upperArmWidth, forearmWidth, skinColor, shadowColor);
    drawLimb(ctx, pose.rightElbow, pose.rightWrist, forearmWidth, jointRadius * 0.6, skinColorLight);
    if (gloves) {
      drawGlove(ctx, pose.rightWrist, jointRadius * 1.8, gloveColor, false);
    } else {
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(pose.rightWrist.x, pose.rightWrist.y, jointRadius * 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

