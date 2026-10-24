import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/**
 * RepsIn logo — a bold slab "R" monogram with a vertical dumbbell down the
 * center of the bowl/stem. Traced from the brand mark as vector paths so it
 * tints to any color (black on light surfaces, white on the purple gradients)
 * and stays crisp at any size.
 *
 * viewBox 0..100. The R is one filled shape with the counter (hole) cut out
 * via the evenodd rule; the dumbbell is drawn on top in the same color.
 */
export default function Logo({ size = 48, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Bold R with its counter knocked out (even-odd). */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d={
          // outer silhouette: left stem up, across the top, down the bowl's
          // right side, then the diagonal leg to the bottom-right.
          'M28 12' +
          ' H58' +
          ' C72 12 82 23 82 37' +
          ' C82 49 74 59 62 61' +
          ' L80 88' +
          ' H62' +
          ' L42 58' +
          ' V47' +
          ' H56' +
          ' C62 47 66 43 66 37' +
          ' C66 31 62 27 56 27' +
          ' H42' +
          ' V88' +
          ' H28' +
          ' Z'
        }
        fill={color}
      />

      {/* Vertical dumbbell centered over the stroke (x ~= 50). */}
      {/* handle */}
      <Rect x="47" y="30" width="6" height="40" rx="3" fill={color} />
      {/* inner plates (long) */}
      <Rect x="35" y="38" width="30" height="8" rx="4" fill={color} />
      <Rect x="35" y="54" width="30" height="8" rx="4" fill={color} />
      {/* outer plates (short) */}
      <Rect x="40" y="30" width="20" height="6.5" rx="3.2" fill={color} />
      <Rect x="40" y="63.5" width="20" height="6.5" rx="3.2" fill={color} />
      {/* round-ish end tips */}
      <Rect x="46" y="26" width="8" height="4.5" rx="2.2" fill={color} />
      <Rect x="46" y="69.5" width="8" height="4.5" rx="2.2" fill={color} />
    </Svg>
  );
}
