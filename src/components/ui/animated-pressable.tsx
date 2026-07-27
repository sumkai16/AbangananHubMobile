import { cssInterop } from 'nativewind';
import { forwardRef } from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);
// NativeWind's className→style transform only auto-applies to JSX tags it
// recognizes statically (View, Pressable, etc. imported from 'react-native')
// — this wrapper is a runtime-created Animated component, so it needs to be
// registered explicitly or `className` on every call site would be silently
// ignored instead of styling anything.
cssInterop(AnimatedPressableBase, { className: 'style' });

// Consistent tap feedback for every tappable surface in the app — a slight
// spring-back scale (not opacity, which NativeWind's `active:` variant
// already handles per DESIGN.md) so cards/buttons feel physically pressed.
// scaleTo defaults to 0.97 (subtle, for cards/rows); pass 0.95 for buttons
// where a slightly stronger squash reads better at that size.
export const AnimatedPressable = forwardRef<View, PressableProps & { scaleTo?: number }>(
  ({ scaleTo = 0.97, onPressIn, onPressOut, style, children, ...props }, ref) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
      <AnimatedPressableBase
        ref={ref}
        style={[animatedStyle, style]}
        onPressIn={(e) => {
          scale.value = withSpring(scaleTo, { damping: 16, stiffness: 400 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, { damping: 16, stiffness: 400 });
          onPressOut?.(e);
        }}
        {...props}>
        {children}
      </AnimatedPressableBase>
    );
  }
);
AnimatedPressable.displayName = 'AnimatedPressable';
