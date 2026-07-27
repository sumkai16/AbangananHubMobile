import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Wraps a FlatList row for a one-time staggered entrance (30-40ms per item,
// per the design system's motion rules) — capped at 8 items so a long list
// doesn't keep firing delayed animations well past what's visible on
// first paint. Reanimated's `entering` only plays once per mount, so this
// is naturally a no-op on re-renders and on items paginated in later
// (those mount without a stagger, which reads as instant — the flash of
// fresh content on `onEndReached` shouldn't feel delayed).
export function StaggeredItem({ index, children }: { index: number; children: ReactNode }) {
  const delay = Math.min(index, 8) * 40;
  return <Animated.View entering={FadeInDown.duration(260).delay(delay).springify().damping(18)}>{children}</Animated.View>;
}
