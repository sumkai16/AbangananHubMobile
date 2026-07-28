import { MapPin, Search } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/animated-pressable';

// Compressed "Where to?" pill, Airbnb's search-entry shape translated for
// this app's actual filter surface — a single location segment, not
// When/Who segments, since there's no date-based booking or guest count in
// the data model. Tapping it opens the full-screen search takeover
// (`/search`), matching the collapsed→expanded relationship Airbnb uses.
export function SearchPill({
  location,
  filterCount,
  onPress,
}: {
  location: string;
  filterCount: number;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      scaleTo={0.97}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={location ? `Search, currently filtered to ${location}` : 'Search by location and filters'}
      className="mx-4 -mt-5 h-12 flex-row items-center gap-2 rounded-full border border-border bg-surface px-4 active:opacity-80">
      <MapPin size={16} color="#64748B" />
      <Text
        className={`flex-1 text-[14px] ${location ? 'font-semibold text-text-primary' : 'text-text-muted'}`}
        numberOfLines={1}>
        {location || 'Where to?'}
      </Text>
      {filterCount > 0 && (
        <View className="h-5 w-5 items-center justify-center rounded-full bg-secondary">
          <Text className="text-[10px] font-bold text-white">{filterCount}</Text>
        </View>
      )}
      <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary">
        <Search size={15} color="#FFFFFF" />
      </View>
    </AnimatedPressable>
  );
}
