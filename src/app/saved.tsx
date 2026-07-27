import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PropertyCard } from '@/components/property-card';
import { extractErrorMessage } from '@/lib/api-error';
import { listFavorites, type Favorite } from '@/lib/favorites';
import { toggleFavorite } from '@/lib/properties';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    try {
      const data = await listFavorites();
      if (requestId !== latestRequestId.current) return;
      setFavorites(data);
      setError(null);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      // eslint-disable-next-line no-console -- real error, not a debug leftover.
      console.error('[FavoritesScreen] failed to load favorites', err);
      setError(extractErrorMessage(err));
    }
  }, []);

  // Re-fetch whenever this tab regains focus — favoriting/unfavoriting
  // happens from the Home tab and the property detail screen too, so this
  // list would otherwise go stale the moment either of those changes it.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      load().finally(() => setIsLoading(false));
    }, [load])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  async function handleToggleFavorite(favorite: Favorite) {
    // Unfavoriting here means removing it from this list entirely, not
    // just flipping a heart icon in place.
    setFavorites((prev) => prev.filter((f) => f.favorite_id !== favorite.favorite_id));
    try {
      await toggleFavorite(favorite.property.property_id);
    } catch {
      setFavorites((prev) => [...prev, favorite]);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-black tracking-tight text-text-primary">Saved Listings</Text>
        <Text className="mt-0.5 text-[12.5px] text-text-muted">
          {favorites.length} propert{favorites.length === 1 ? 'y' : 'ies'} saved
        </Text>
      </View>

      {error && (
        <View className="mx-4 mb-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
          <Text className="text-xs font-semibold text-error">{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#156F8C" />
        </View>
      ) : favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="heart-outline" size={32} color="#2AA7A1" />
          <Text className="mt-3 text-center text-base font-semibold text-text-primary">
            No favorites yet
          </Text>
          <Text className="mt-1 text-center text-sm text-text-muted">
            Tap the heart on a property to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.favorite_id)}
          contentContainerStyle={{ gap: 16, padding: 16 }}
          renderItem={({ item }) => (
            <PropertyCard
              property={item.property}
              onPress={() => router.push(`/property/${item.property.property_id}`)}
              onToggleFavorite={() => handleToggleFavorite(item)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#156F8C" />
          }
        />
      )}
    </SafeAreaView>
  );
}
