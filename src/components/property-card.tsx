import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import type { Property } from '@/lib/properties';

const CARD_WIDTH = { featured: 168 };

/**
 * One card, two layouts — matches the prototype's two contexts rather than
 * two components: `list` is the full-width row used in the main listings
 * feed (photo, category badge, heart, title, address, rating, price on one
 * row), `featured` is the compact tile used in the horizontal "Featured
 * near you" scroller (badge label + title + price only, no address/rating —
 * there isn't room for it at that width).
 */
export function PropertyCard({
  property,
  variant = 'list',
  onPress,
  onToggleFavorite,
}: {
  property: Property;
  variant?: 'list' | 'featured';
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const coverImage = property.media?.[0]?.media_url;
  const isFeatured = variant === 'featured';

  return (
    <Pressable
      className="active:opacity-90"
      style={isFeatured ? { width: CARD_WIDTH.featured } : undefined}
      onPress={onPress}>
      <View
        className={`w-full overflow-hidden rounded-2xl bg-section ${isFeatured ? 'h-28' : 'h-40'}`}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="home-outline" size={isFeatured ? 22 : 32} color="#2AA7A1" />
          </View>
        )}

        <View className="absolute left-2.5 top-2.5 rounded-full bg-text-primary/85 px-2.5 py-1">
          <Text className="text-[9.5px] font-bold uppercase tracking-wide text-white">
            {property.property_type}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          hitSlop={8}
          className="absolute right-2.5 top-2.5 h-8 w-8 items-center justify-center rounded-full bg-black/20 active:scale-95">
          <Ionicons
            name={property.is_favorited ? 'heart' : 'heart-outline'}
            size={16}
            color={property.is_favorited ? '#FF8A65' : '#FFFFFF'}
          />
        </Pressable>
      </View>

      <View className="mt-2 px-0.5">
        <Text
          className={`font-bold text-text-primary ${isFeatured ? 'text-[13px]' : 'text-[15px]'}`}
          numberOfLines={1}>
          {property.title}
        </Text>

        {!isFeatured && (
          <Text className="mt-0.5 text-[12.5px] font-medium text-primary" numberOfLines={1}>
            {property.address}
          </Text>
        )}

        <View className="mt-1.5 flex-row items-center justify-between">
          {!isFeatured && !!property.review_count ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={13} color="#FBBF24" />
              <Text className="text-[13px] font-semibold text-text-primary">
                {property.avg_rating?.toFixed(1)}
              </Text>
              <Text className="text-[12px] text-text-muted">({property.review_count})</Text>
            </View>
          ) : (
            <View />
          )}

          <Text className={`font-bold text-primary ${isFeatured ? 'text-[13px]' : 'text-[14px]'}`}>
            {property.min_rental_fee ? (
              <>
                ₱{property.min_rental_fee.toLocaleString()}
                {!isFeatured && <Text className="text-[11px] font-medium text-text-muted">/month</Text>}
              </>
            ) : (
              <Text className="text-[12px] font-normal text-text-muted">Price unavailable</Text>
            )}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
