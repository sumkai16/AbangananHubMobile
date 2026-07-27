import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api-error';
import { getProperty, toggleFavorite, type PropertyDetail } from '@/lib/properties';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Number(id);
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getProperty(propertyId);
      setProperty(data);
      setError(null);
    } catch (err) {
      // eslint-disable-next-line no-console -- real error, not a debug leftover.
      console.error('[PropertyDetailScreen] failed to load property', err);
      setError(extractErrorMessage(err));
    }
  }, [propertyId]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  async function handleToggleFavorite() {
    if (!property) return;
    const previous = property.is_favorited;
    setProperty({ ...property, is_favorited: !previous });
    try {
      const favorited = await toggleFavorite(property.property_id);
      setProperty((p) => (p ? { ...p, is_favorited: favorited } : p));
    } catch {
      setProperty((p) => (p ? { ...p, is_favorited: previous } : p));
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator color="#156F8C" />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ title: '' }} />
        <Text className="text-center text-sm font-semibold text-error">
          {error ?? 'Property not found.'}
        </Text>
      </View>
    );
  }

  const images = property.media?.filter((m) => m.media_type === 'Image') ?? [];

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: '' }} />
      <ScrollView bounces={false}>
        <View className="relative bg-section" style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => String(item.media_id)}
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
              <Ionicons name="home-outline" size={48} color="#2AA7A1" />
            </View>
          )}

          <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0">
            <View className="flex-row justify-end px-4 pt-2">
              <Pressable
                onPress={handleToggleFavorite}
                hitSlop={8}
                className="h-11 w-11 items-center justify-center rounded-full bg-black/30 active:scale-95">
                <Ionicons
                  name={property.is_favorited ? 'heart' : 'heart-outline'}
                  size={20}
                  color={property.is_favorited ? '#EF4444' : '#FFFFFF'}
                />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        <View className="px-4 pb-10 pt-5">
          <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            {property.property_type}
          </Text>
          <Text className="text-xl font-black text-text-primary">{property.title}</Text>

          <View className="mt-1.5 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color="#64748B" />
            <Text className="text-sm text-text-muted">{property.address}</Text>
          </View>

          {property.review_count > 0 && (
            <View className="mt-2 flex-row items-center gap-1">
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text className="text-sm font-semibold text-text-primary">
                {property.avg_rating?.toFixed(1)}
              </Text>
              <Text className="text-sm text-text-muted">
                ({property.review_count} {property.review_count === 1 ? 'review' : 'reviews'})
              </Text>
            </View>
          )}

          {!!property.description && (
            <Text className="mt-4 text-sm leading-relaxed text-text-primary">
              {property.description}
            </Text>
          )}

          {!!property.amenities?.length && (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <View
                  key={amenity.amenity_id}
                  className="rounded-full border border-secondary/30 bg-section px-3 py-1.5">
                  <Text className="text-xs font-semibold text-text-primary">{amenity.name}</Text>
                </View>
              ))}
            </View>
          )}

          {!!property.units?.length && (
            <View className="mt-6">
              <Text className="mb-3 text-base font-bold text-text-primary">Available units</Text>
              <View className="gap-3">
                {property.units.map((unit) => (
                  <View
                    key={unit.unit_id}
                    className="rounded-xl border border-border bg-surface p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-text-primary">{unit.unit_label}</Text>
                      <View
                        className={`rounded-full px-2.5 py-0.5 ${
                          unit.availability_status === 'Available' ? 'bg-success/10' : 'bg-warning/10'
                        }`}>
                        <Text
                          className={`text-[11px] font-bold ${
                            unit.availability_status === 'Available' ? 'text-success' : 'text-warning'
                          }`}>
                          {unit.availability_status}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-1 text-sm font-semibold text-text-primary">
                      ₱{unit.rental_fee.toLocaleString()}
                      <Text className="text-xs font-normal text-text-muted"> /month</Text>
                    </Text>
                    {!!unit.description && (
                      <Text className="mt-1 text-xs text-text-muted">{unit.description}</Text>
                    )}
                    {unit.availability_status === 'Available' && (
                      <View className="mt-3">
                        <Button
                          title="Send Inquiry"
                          variant="cta"
                          onPress={() =>
                            router.push({
                              pathname: '/reservation/inquire',
                              params: {
                                unitId: String(unit.unit_id),
                                propertyTitle: property.title,
                                unitLabel: unit.unit_label,
                                rentalFee: String(unit.rental_fee),
                              },
                            })
                          }
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
