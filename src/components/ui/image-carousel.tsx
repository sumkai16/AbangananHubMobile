import { Image } from 'expo-image';
import { ArrowLeft, Heart, Home, Share2 } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Dimensions, FlatList, Pressable, View, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PropertyMedia } from '@/lib/properties';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Edge-to-edge photo carousel with floating overlay controls, Airbnb's
// listing-detail pattern. Formalizes the paging FlatList this screen
// already used inline — same mechanism (no new dependency), just made
// reusable and given a page-dot indicator now that it isn't sitting inside
// a padded card context.
export function ImageCarousel({
  images,
  onBack,
  onShare,
  isFavorited,
  onToggleFavorite,
  renderExtraOverlayButtons,
}: {
  images: PropertyMedia[];
  onBack: () => void;
  onShare?: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  renderExtraOverlayButtons?: () => ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleViewableItemsChanged({ viewableItems }: { viewableItems: ViewToken[] }) {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }

  return (
    <View className="relative bg-section" style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}>
      {images.length > 0 ? (
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.media_id)}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.media_url }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              contentFit="cover"
            />
          )}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Home size={48} color="#2AA7A1" />
        </View>
      )}

      {images.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center gap-1.5">
          {images.map((item, i) => (
            <View
              key={item.media_id}
              className={`h-1.5 rounded-full ${i === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
            />
          ))}
        </View>
      )}

      <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-11 w-11 items-center justify-center rounded-full bg-black/30 active:scale-95">
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
          <View className="flex-row gap-2">
            {!!onShare && (
              <Pressable
                onPress={onShare}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Share this listing"
                className="h-11 w-11 items-center justify-center rounded-full bg-black/30 active:scale-95">
                <Share2 size={19} color="#FFFFFF" />
              </Pressable>
            )}
            {renderExtraOverlayButtons?.()}
            <Pressable
              onPress={onToggleFavorite}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isFavorited ? 'Remove from saved' : 'Save this listing'}
              className="h-11 w-11 items-center justify-center rounded-full bg-black/30 active:scale-95">
              <Heart
                size={20}
                color={isFavorited ? '#FF8A65' : '#FFFFFF'}
                fill={isFavorited ? '#FF8A65' : 'transparent'}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
