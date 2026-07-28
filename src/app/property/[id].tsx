import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUpDown, Flag, MapPin, Star } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { UnitDetailModal } from '@/components/unit-detail-modal';
import { Button } from '@/components/ui/button';
import { BottomActionBar } from '@/components/ui/bottom-action-bar';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { SortSheet } from '@/components/ui/sort-sheet';
import { StaggeredItem } from '@/components/ui/staggered-item';
import { StarRating } from '@/components/ui/star-rating';
import { extractErrorMessage } from '@/lib/api-error';
import { getProperty, toggleFavorite, type PropertyDetail, type Review } from '@/lib/properties';
import { relativeTime } from '@/lib/relative-time';

const REVIEW_SORT_LABELS = { recent: 'Most recent', highest: 'Highest rated', lowest: 'Lowest rated' } as const;

function sortReviews(reviews: Review[], sort: keyof typeof REVIEW_SORT_LABELS): Review[] {
  const sorted = [...reviews];
  if (sort === 'highest') return sorted.sort((a, b) => b.rating - a.rating);
  if (sort === 'lowest') return sorted.sort((a, b) => a.rating - b.rating);
  return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Number(id);
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);

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

  async function handleShare() {
    if (!property) return;
    try {
      await Share.share({ message: `${property.title} — ${property.address}\n${property.description ?? ''}`.trim() });
    } catch {
      // User dismissed the share sheet — nothing to recover from.
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
  const availableUnits = property.units?.filter((u) => u.availability_status === 'Available') ?? [];
  const lowestPrice = availableUnits.length
    ? Math.min(...availableUnits.map((u) => u.rental_fee))
    : property.min_rental_fee;

  function handlePrimaryCta() {
    if (availableUnits.length === 1) {
      const unit = availableUnits[0];
      router.push({
        pathname: '/reservation/inquire',
        params: {
          unitId: String(unit.unit_id),
          propertyTitle: property!.title,
          unitLabel: unit.unit_label,
          rentalFee: String(unit.rental_fee),
        },
      });
    } else {
      setIsUnitModalVisible(true);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: '', headerShown: false }} />
      <ScrollView bounces={false}>
        <ImageCarousel
          images={images}
          onBack={() => router.back()}
          onShare={handleShare}
          isFavorited={property.is_favorited}
          onToggleFavorite={handleToggleFavorite}
          renderExtraOverlayButtons={() => (
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
              <Flag size={19} color="#FFFFFF" />
            </Pressable>
          )}
        />

        <View className="px-4 pb-28 pt-5">
          <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            {property.property_type}
          </Text>
          <Text className="text-xl font-black text-text-primary">{property.title}</Text>

          <View className="mt-1.5 flex-row items-center gap-1">
            <MapPin size={13} color="#64748B" />
            <Text className="text-sm text-text-muted">{property.address}</Text>
          </View>

          {property.review_count > 0 && (
            <View className="mt-2 flex-row items-center gap-1">
              <Star size={14} color="#FBBF24" fill="#FBBF24" />
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
                    {/* Skipped when there's exactly one available unit — the
                        sticky bottom bar's CTA already covers that case
                        (handlePrimaryCta), and showing both here and there
                        duplicates the same action. */}
                    {unit.availability_status === 'Available' && availableUnits.length > 1 && (
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
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-text-primary">Reviews</Text>
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
              <Text className="text-sm text-text-muted">No reviews yet.</Text>
            ) : (
              <>
                <View className="mb-4 flex-row items-center gap-4">
                  <Text className="text-[40px] font-black leading-none text-text-primary">
                    {property.avg_rating?.toFixed(1)}
                  </Text>
                  <View>
                    <StarRating value={Math.round(property.avg_rating ?? 0)} size={14} />
                    <Text className="mt-1 text-[12.5px] text-text-muted">
                      {property.review_count} {property.review_count === 1 ? 'review' : 'reviews'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setIsSortSheetOpen(true)}
                  className="mb-3 flex-row items-center gap-1.5 self-start rounded-full border border-border bg-surface px-3 py-1.5 active:opacity-70">
                  <ArrowUpDown size={13} color="#64748B" />
                  <Text className="text-[12px] font-semibold text-text-primary">
                    {REVIEW_SORT_LABELS[reviewSort]}
                  </Text>
                </Pressable>

                <View className="rounded-2xl border border-border bg-surface px-4">
                  {sortReviews(property.reviews, reviewSort).map((review, i) => (
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
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <SortSheet
        visible={isSortSheetOpen}
        onClose={() => setIsSortSheetOpen(false)}
        value={reviewSort}
        onChange={setReviewSort}
        options={[
          { value: 'recent', label: REVIEW_SORT_LABELS.recent },
          { value: 'highest', label: REVIEW_SORT_LABELS.highest },
          { value: 'lowest', label: REVIEW_SORT_LABELS.lowest },
        ]}
      />

      {availableUnits.length > 0 && (
        <BottomActionBar>
          <View>
            <Text className="text-[11px] font-medium text-text-muted">From</Text>
            <Text className="text-base font-black text-primary">
              ₱{lowestPrice?.toLocaleString()}
              <Text className="text-xs font-medium text-text-muted"> /month</Text>
            </Text>
          </View>
          <Button
            title={availableUnits.length === 1 ? 'Send Inquiry' : 'View units'}
            variant="cta"
            fullWidth={false}
            onPress={handlePrimaryCta}
          />
        </BottomActionBar>
      )}

      <UnitDetailModal
        visible={isUnitModalVisible}
        onClose={() => setIsUnitModalVisible(false)}
        units={property.units ?? []}
        propertyTitle={property.title}
      />
    </View>
  );
}
