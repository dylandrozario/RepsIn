import React from 'react';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

/**
 * Line-style nav/UI icons, drawn with react-native-svg so they tint cleanly
 * and stay crisp at any size. Each takes { size, color, strokeWidth }.
 */

export function HomeIcon({ size = 24, color = '#000', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5 12 3l9 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 21v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ForecastIcon({ size = 24, color = '#000', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* axes */}
      <Path
        d="M4 3v16a1 1 0 0 0 1 1h16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* trend line with up arrow */}
      <Path
        d="M7 14.5 11 10l3 2.5 4-4.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 8H18v2.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WorkoutIcon({ size = 24, color = '#000', strokeWidth = 2 }) {
  // Dumbbell
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Rect x="4.5" y="8.5" width="3" height="7" rx="1.2" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="16.5" y="8.5" width="3" height="7" rx="1.2" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="3" y1="10.5" x2="3" y2="13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="21" y1="10.5" x2="21" y2="13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function TrackerIcon({ size = 24, color = '#000', strokeWidth = 2 }) {
  // Target / camera-focus ring
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="12" cy="12" r="3" fill={color} />
    </Svg>
  );
}

export function ProfileIcon({ size = 24, color = '#000', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function FloorIcon({ size = 24, color = '#000', strokeWidth = 2 }) {
  // Gym floor plan — a 2×2 grid of equipment stations.
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function ClockIcon({ size = 24, color = '#000', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 7v5l3.5 2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PinIcon({ size = 24, color = '#000' }) {
  // Solid map pin (teardrop + hollow center), matching the provided glyph.
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={color}
      />
      <Circle cx="12" cy="9" r="2.6" fill="#fff" />
    </Svg>
  );
}

// Map a route name to its icon component (used by the tab bar).
export const TAB_ICONS = {
  Home: HomeIcon,
  Forecast: ForecastIcon,
  Floor: FloorIcon,
  Workout: WorkoutIcon,
  Tracker: TrackerIcon,
  Profile: ProfileIcon,
};
