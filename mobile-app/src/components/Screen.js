import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/theme';

/**
 * Standard screen wrapper: cream background, safe-area aware, scrollable.
 * Adds bottom padding so content clears the floating tab bar.
 */
export default function Screen({ children, scroll = true, contentStyle }) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: insets.top + spacing.sm,
    paddingBottom: insets.bottom + 110,
    paddingHorizontal: spacing.xl,
  };

  if (!scroll) {
    return <View style={[styles.base, pad, contentStyle]}>{children}</View>;
  }
  return (
    <View style={styles.base}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[pad, contentStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: colors.bg },
});
