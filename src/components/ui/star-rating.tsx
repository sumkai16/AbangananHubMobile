import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AnimatedPressable } from './animated-pressable';

// Read-only display when onChange is omitted; tappable 1-5 picker otherwise.
export function StarRating({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) =>
        onChange ? (
          <AnimatedPressable
            key={star}
            scaleTo={0.8}
            onPress={() => onChange(star)}
            hitSlop={10}
            accessibilityRole="radio"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
            accessibilityState={{ selected: star <= value }}>
            <Ionicons name={star <= value ? 'star' : 'star-outline'} size={size} color="#FBBF24" />
          </AnimatedPressable>
        ) : (
          <Ionicons key={star} name={star <= value ? 'star' : 'star-outline'} size={size} color="#FBBF24" />
        )
      )}
    </View>
  );
}
