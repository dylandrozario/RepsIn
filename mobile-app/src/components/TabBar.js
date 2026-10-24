import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme/theme';
import { useTracking } from '../tracker/trackingState';
import { TAB_ICONS } from './Icons';

const BAR_PAD = 6;

/**
 * Floating pill tab bar with a sticky, smoothly sliding active indicator.
 * Tabs have variable width (inactive = icon only, active = icon + label), so
 * we measure each tab's layout and slide/resize the purple pill to match.
 * Hidden entirely during full-screen moments (camera tracking, availability,
 * the best-time reveal) via the nav-visibility store.
 */
export default function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const hidden = useTracking();

  // Measured { x, width } for each tab, relative to the row.
  const [layouts, setLayouts] = useState({});
  const x = useRef(new Animated.Value(0)).current;
  const w = useRef(new Animated.Value(0)).current;

  const activeLayout = layouts[state.index];

  useEffect(() => {
    if (!activeLayout) return;
    Animated.parallel([
      Animated.timing(x, {
        toValue: activeLayout.x,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(w, {
        toValue: activeLayout.width,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeLayout, x, w]);

  if (hidden) return null;

  const havePill = Boolean(activeLayout);

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <View style={[styles.bar, shadow.float]}>
        {/* sliding + resizing purple pill behind the active tab */}
        {havePill ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.pill, { transform: [{ translateX: x }], width: w }]}
          />
        ) : null}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
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
              onLayout={(e) => {
                const { x: lx, width } = e.nativeEvent.layout;
                setLayouts((prev) => {
                  const cur = prev[index];
                  if (cur && Math.abs(cur.x - lx) < 0.5 && Math.abs(cur.width - width) < 0.5) return prev;
                  return { ...prev, [index]: { x: lx, width } };
                });
              }}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
            >
              {(() => {
                const Icon = TAB_ICONS[route.name];
                const tint = focused ? colors.onPurple : colors.inkSoft;
                return Icon ? <Icon size={21} color={tint} strokeWidth={2} /> : null;
              })()}
              {focused ? (
                <Text numberOfLines={1} style={styles.labelActive}>{label}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 12 },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: BAR_PAD,
    alignItems: 'center',
    alignSelf: 'center',
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: BAR_PAD,
    bottom: BAR_PAD,
    borderRadius: radius.pill,
    backgroundColor: colors.purple,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  labelActive: { color: colors.onPurple, fontWeight: '700', fontSize: 13, marginLeft: 7 },
});
