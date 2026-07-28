import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Generic sticky-bottom bar for a screen's single most important action
// (price + Reserve/Send Inquiry, price + Pay). Flat fill, hairline top
// border only — no shadow, matching DESIGN.md §7d. Owns chrome, not the
// action itself: pass a real `Button` as a child, this doesn't style one.
export function BottomActionBar({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 border-t border-border bg-surface">
      <View className="flex-row items-center justify-between gap-3 px-4 pb-3 pt-3">{children}</View>
    </SafeAreaView>
  );
}
