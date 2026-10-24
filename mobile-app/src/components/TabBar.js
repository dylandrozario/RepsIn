import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

const GLYPHS = {
  Home:         '⌂',
  Availability: '▦',
  Workout:      '▤',
  Tracker:      '◉',
  Form:         '◉',
};

export default function TabBar({ state, descriptors, navigation }) {
  const insets  = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const tabCount  = state.routes.length;

  // Each tab gets an equal share of the bar width.
  // Cap tab width so labels never overflow on narrow phones.
  const maxBarWidth = Math.min(width - 32, 480); // 16px margin each side
  const tabWidth    = Math.floor(maxBarWidth / tabCount);

  // Scale text so it always fits regardless of screen width or tab count
  const labelSize = tabWidth < 72 ? 11 : tabWidth < 86 ? 12 : 13;
  const glyphSize = tabWidth < 72 ? 13 : 15;

  return (
    // The outer View sits above the home indicator via insets.bottom.
    // pointerEvents="box-none" lets taps pass through the transparent gap.
    <View
      style={[styles.wrap, { bottom: insets.bottom + 8 }]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, { width: maxBarWidth }, shadow.float]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label   = options.title ?? route.name;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[
                styles.tab,
                { width: tabWidth },
                focused && { backgroundColor: theme.accent },
              ]}
            >
              <Text style={[styles.glyph, { fontSize: glyphSize }, focused && styles.glyphActive]}>
                {GLYPHS[route.name] || '•'}
              </Text>
              <Text
                style={[styles.label, { fontSize: labelSize }, focused && styles.labelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    // Do not set a fixed width here — let the inner bar control it
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    alignSelf: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
  },
  glyph:       { color: colors.inkSoft, marginRight: 5 },
  glyphActive: { color: colors.onPurple },
  label:       { color: colors.inkSoft, fontWeight: '600' },
  labelActive: { color: colors.onPurple, fontWeight: '700' },
});
