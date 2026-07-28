import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Text, View, type PressableProps } from 'react-native';

import { AnimatedPressable } from './animated-pressable';

// The one button in the app. Flat solid fills, no gradients — see
// context/DESIGN.md § 7. Every variant is >= 48px tall, clearing the 44pt/48dp
// minimum touch target without each call site having to remember it.
type Variant = 'primary' | 'cta' | 'outline' | 'danger';

const VARIANTS: Record<
  Variant,
  { container: string; label: string; spinner: string; icon: string }
> = {
  // Ocean Teal — the default affirmative action.
  primary: { container: 'bg-secondary', label: 'text-white', spinner: '#FFFFFF', icon: '#FFFFFF' },
  // Soft Coral — reserved for the single most important action on a screen
  // (pay, book). Two coral buttons on one screen means neither is the CTA.
  cta: { container: 'bg-cta', label: 'text-white', spinner: '#FFFFFF', icon: '#FFFFFF' },
  outline: {
    container: 'border border-border bg-surface',
    label: 'text-text-primary',
    spinner: '#156F8C',
    icon: '#64748B',
  },
  danger: {
    container: 'border border-error/30 bg-surface',
    label: 'text-error',
    spinner: '#EF4444',
    icon: '#EF4444',
  },
};

export function Button({
  title,
  variant = 'primary',
  icon,
  isLoading,
  disabled,
  fullWidth = true,
  ...props
}: PressableProps & {
  title: string;
  variant?: Variant;
  icon?: LucideIcon;
  isLoading?: boolean;
  fullWidth?: boolean;
}) {
  const style = VARIANTS[variant];
  const isDisabled = disabled || isLoading;
  const IconComponent = icon;

  return (
    <AnimatedPressable disabled={isDisabled} scaleTo={0.95} {...props}>
      {({ pressed }) => (
        <View
          className={`h-12 flex-row items-center justify-center gap-2 rounded-xl px-5 ${
            style.container
          } ${fullWidth ? '' : 'self-start'}`}
          style={{ opacity: pressed ? 0.85 : isDisabled ? 0.5 : 1 }}>
          {isLoading ? (
            <ActivityIndicator color={style.spinner} />
          ) : (
            <>
              {!!IconComponent && <IconComponent size={16} color={style.icon} />}
              <Text className={`text-[15px] font-semibold ${style.label}`}>{title}</Text>
            </>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}
