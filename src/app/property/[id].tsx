import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { StaggeredItem } from '@/components/ui/staggered-item';
import { StarRating } from '@/components/ui/star-rating';
import { extractErrorMessage } from '@/lib/api-error';
import { getProperty, toggleFavorite, type PropertyDetail } from '@/lib/properties';
import { relativeTime } from '@/lib/relative-time';

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
        <Stack.Screen options={{ title: '', headerShown: false }} />
        <ActivityIndicator color="#156F8C" />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ title: '', headerShown: false }} />
        <Text className="text-center text-sm font-semibold text-error">
          {error ?? 'Property not found.'}
        </Text>
      </View>
    );
  }

  const images = property.media?.filter((m) => m.media_type === 'Image') ?? [];

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: '', headerShown: false }} />
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
            <View className="flex-row items-center justify-between px-4 pt-2">
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-11 w-11 items-center justify-center rounded-full bg-black/30 active:scale-95">
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/reports/submit',
                      params: { propertyId: String(property.property_id), propertyTitle: property.title },
                    })
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Report this listing"
                  className="h-11 w-11 items-center justify-center rounded-full bg-black/30 active:scale-95">
                  <Ionicons name="flag-outline" size={19} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  onPress={handleToggleFavorite}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={property.is_favorited ? 'Remove from saved' : 'Save this listing'}
                  className="h-11 w-11 items-center justify-center rounded-full bg-black/30 active:scale-95">
                  <Ionicons
                    name={property.is_favorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={property.is_favorited ? '#FF8A65' : '#FFFFFF'}
                  />
                </Pressable>
              </View>
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
              <Text className="mb-1 text-base font-bold text-text-primary">Available units</Text>
              <View className="rounded-2xl border border-border bg-surface px-4">
                {property.units.map((unit, i) => (
                  <View
                    key={unit.unit_id}
                    className={i > 0 ? 'border-t border-border py-4' : 'py-4'}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-text-primary">{unit.unit_label}</Text>
                        <Text className="mt-0.5 text-sm font-semibold text-text-primary">
                          ₱{unit.rental_fee.toLocaleString()}
                          <Text className="text-xs font-normal text-text-muted"> /month</Text>
                        </Text>
                        {!!unit.description && (
                          <Text className="mt-1 text-xs text-text-muted">{unit.description}</Text>
                        )}
                      </View>
                      <Text
                        className={`text-xs font-bold ${
                          unit.availability_status === 'Available' ? 'text-success' : 'text-warning'
                        }`}>
                        {unit.availability_status}
                      </Text>
                    </View>
                    {unit.availability_status === 'Available' && (
                      <View className="mt-3">
                        <Button
                          title="Send Inquiry"
                          variant="primary"
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

          <View className="mt-6">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-base font-bold text-text-primary">
                Reviews {property.review_count > 0 ? `(${property.review_count})` : ''}
              </Text>
              {property.can_review && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/reviews/submit',
                      params: { propertyId: String(property.property_id), propertyTitle: property.title },
                    })
                  }
                  hitSlop={6}>
                  <Text className="text-[12.5px] font-semibold text-primary">Write a review</Text>
                </Pressable>
              )}
            </View>

            {property.reviews.length === 0 ? (
              <Text className="mt-2 text-sm text-text-muted">No reviews yet.</Text>
            ) : (
              <View className="mt-2 rounded-2xl border border-border bg-surface px-4">
                {property.reviews.map((review, i) => (
                  <StaggeredItem key={review.review_id} index={i}>
                    <View className={i > 0 ? 'border-t border-border py-4' : 'py-4'}>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-semibold text-text-primary">
                          {review.tenant?.first_name} {review.tenant?.last_name}
                        </Text>
                        <Text className="text-xs text-text-muted">{relativeTime(review.created_at)}</Text>
                      </View>
                      <View className="mt-1">
                        <StarRating value={review.rating} size={13} />
                      </View>
                      {!!review.review_comment && (
                        <Text className="mt-1.5 text-sm text-text-primary">{review.review_comment}</Text>
                      )}
                      {!!review.landlord_reply && (
                        <View className="mt-2 rounded-xl bg-section px-3 py-2">
                          <Text className="text-xs font-bold text-primary">Landlord response</Text>
                          <Text className="mt-0.5 text-xs text-text-primary">{review.landlord_reply}</Text>
                        </View>
                      )}
                    </View>
                  </StaggeredItem>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
