import React from 'react';
import Svg, { Line, Circle } from 'react-native-svg';
import { colors } from '../theme/theme';

/**
 * Draws the MediaPipe pose skeleton over the camera preview.
 * Landmarks are normalized (0..1); we scale by the view size.
 * Connections use the subset of the 33-point model relevant to form.
 */
const CONNECTIONS = [
  // arms
  [11, 13], [13, 15], [12, 14], [14, 16],
  // shoulders + torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // legs
  [23, 25], [25, 27], [27, 31], [24, 26], [26, 28], [28, 32],
];

const KEY_POINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

export default function SkeletonOverlay({ landmarks, width, height, formOk = true, mirror = true }) {
  if (!landmarks || !landmarks.length || !width || !height) return null;

  const stroke = formOk ? colors.purpleBright : colors.high;

  const px = (lm) => (mirror ? (1 - lm.x) * width : lm.x * width);
  const py = (lm) => lm.y * height;

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {CONNECTIONS.map(([a, b], i) => {
        const la = landmarks[a];
        const lb = landmarks[b];
        if (!la || !lb) return null;
        if ((la.visibility ?? 1) < 0.4 || (lb.visibility ?? 1) < 0.4) return null;
        return (
          <Line
            key={`c${i}`}
            x1={px(la)}
            y1={py(la)}
            x2={px(lb)}
            y2={py(lb)}
            stroke={stroke}
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}
      {KEY_POINTS.map((idx) => {
        const lm = landmarks[idx];
        if (!lm || (lm.visibility ?? 1) < 0.4) return null;
        return <Circle key={`p${idx}`} cx={px(lm)} cy={py(lm)} r={6} fill="#fff" stroke={stroke} strokeWidth={2} />;
      })}
    </Svg>
  );
}
