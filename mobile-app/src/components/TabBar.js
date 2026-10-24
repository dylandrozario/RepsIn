import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme/theme';

const GLYPHS = {
  Home: '⌂',
  Forecast: '▦',
  Workout: '▤',
  Tracker: '◉',
};

/** Floating pill tab bar; active tab becomes a filled purple pill. */
export default function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <View style={[styles.bar, shadow.float]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <Text style={[styles.glyph, focused && styles.glyphActive]}>{GLYPHS[route.name] || '•'}</Text>
              <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
  },
  tabActive: { backgroundColor: colors.purple },
  glyph: { fontSize: 17, color: colors.inkSoft, marginRight: 8 },
  glyphActive: { color: colors.onPurple },
  label: { fontSize: 15, color: colors.inkSoft, fontWeight: '600' },
  labelActive: { color: colors.onPurple, fontWeight: '700' },
});
