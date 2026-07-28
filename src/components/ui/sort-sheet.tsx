import { CheckCircle2, X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/animated-pressable';

// Hand-rolled bottom sheet for a single sort choice — no bottom-sheet
// library installed in this project, and a plain Modal sliding from the
// bottom matches the app's "don't add a dependency you don't need"
// pattern (see search.tsx's own full-screen takeover, same reasoning).
export function SortSheet<T extends string>({
  visible,
  onClose,
  options,
  value,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <Pressable className="mt-auto" onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']} className="rounded-t-2xl bg-surface">
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3.5">
              <Text className="text-[15px] font-bold text-text-primary">Sort by</Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-11 w-11 items-center justify-center">
                <X size={20} color="#1F2937" />
              </Pressable>
            </View>
            <View className="p-2">
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <AnimatedPressable
                    key={opt.value}
                    scaleTo={0.98}
                    onPress={() => {
                      onChange(opt.value);
                      onClose();
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    className="flex-row items-center justify-between rounded-xl px-3 py-3 active:opacity-70">
                    <Text className={`text-[14px] ${active ? 'font-bold text-primary' : 'text-text-primary'}`}>
                      {opt.label}
                    </Text>
                    {active && <CheckCircle2 size={18} color="#156F8C" />}
                  </AnimatedPressable>
                );
              })}
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
