import { useFocusEffect, useRouter } from 'expo-router';
import { CheckCircle2, Home } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { PropertyCard } from '@/components/property-card';
import { SearchPill } from '@/components/search-pill';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { StaggeredItem } from '@/components/ui/staggered-item';
import { extractErrorMessage } from '@/lib/api-error';
import { useBrowseFilters, type BrowseFilters } from '@/lib/browse-filters-context';
import { listProperties, toggleFavorite, type Paginated, type Property } from '@/lib/properties';

const BROWSE_TYPES = [
  { value: 'Bedspace', label: 'Bedspace' },
  { value: 'Room', label: 'Room' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'House', label: 'House' },
];

export default function BrowseScreen() {
  const router = useRouter();
  const { filters, setFilters } = useBrowseFilters();
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against out-of-order responses — React 19 dev mode double-invokes
  // effects, and a slow page-1 request can otherwise resolve after a newer
  // one and clobber good data with a stale error (or vice versa). Only the
  // most recently *started* request is allowed to touch state.
  const latestRequestId = useRef(0);
  // Tracks which filter values the current list actually reflects, so
  // returning from the search modal only re-fetches when something
  // actually changed — not on every tab focus.
  const appliedFilters = useRef<BrowseFilters | null>(null);

  const fetchPage = useCallback(async (pageToLoad: number, query: BrowseFilters, replace: boolean) => {
    const requestId = ++latestRequestId.current;
    try {
      const parsedPriceMax = query.priceMax ? Number(query.priceMax) : undefined;
      const result: Paginated<Property> = await listProperties({
        location: query.location || undefined,
        type: query.typeFilter || undefined,
        price_max: parsedPriceMax && !Number.isNaN(parsedPriceMax) ? parsedPriceMax : undefined,
        verified: query.verifiedOnly || undefined,
        sort: query.sort,
        page: pageToLoad,
      });
      if (requestId !== latestRequestId.current) return;
      setProperties((prev) => (replace ? result.data : [...prev, ...result.data]));
      setPage(result.current_page);
      setLastPage(result.last_page);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      // eslint-disable-next-line no-console -- real error, not a debug leftover; the banner alone doesn't carry a stack trace.
      console.error('[BrowseScreen] failed to load properties', err);
      setError(extractErrorMessage(err));
    }
  }, []);

  const runQuery = useCallback(
    async (nextFilters: BrowseFilters) => {
      appliedFilters.current = nextFilters;
      setIsLoading(true);
      await fetchPage(1, nextFilters, true);
      setIsLoading(false);
    },
    [fetchPage]
  );

  useFocusEffect(
    useCallback(() => {
      const applied = appliedFilters.current;
      const changed =
        !applied ||
        applied.location !== filters.location ||
        applied.typeFilter !== filters.typeFilter ||
        applied.priceMax !== filters.priceMax ||
        applied.verifiedOnly !== filters.verifiedOnly ||
        applied.sort !== filters.sort;
      if (changed) runQuery(filters);
      // Runs once per focus with the latest filters snapshot — deliberately
      // not depending on `filters` itself, which would re-fire mid-focus.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runQuery])
  );

  function handleTypeFilterTap(type: string) {
    const next = filters.typeFilter === type ? null : type || null;
    const nextFilters = { ...filters, typeFilter: next };
    setFilters(nextFilters);
    runQuery(nextFilters);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchPage(1, filters, true);
    setIsRefreshing(false);
  }

  async function handleLoadMore() {
    if (isLoadingMore || page >= lastPage) return;
    setIsLoadingMore(true);
    await fetchPage(page + 1, filters, false);
    setIsLoadingMore(false);
  }

  async function handleToggleFavorite(property: Property) {
    // Optimistic, matching the web app's toggleFavorite: flip the heart
    // immediately, reconcile with (or revert to) the server response.
    setProperties((prev) =>
      prev.map((p) =>
        p.property_id === property.property_id ? { ...p, is_favorited: !p.is_favorited } : p
      )
    );
    try {
      const favorited = await toggleFavorite(property.property_id);
      setProperties((prev) =>
        prev.map((p) => (p.property_id === property.property_id ? { ...p, is_favorited: favorited } : p))
      );
    } catch {
      setProperties((prev) =>
        prev.map((p) =>
          p.property_id === property.property_id ? { ...p, is_favorited: property.is_favorited } : p
        )
      );
    }
  }

  const featured = properties.slice(0, 6);
  const typeFilterChips = [{ value: '', label: 'All' }, ...BROWSE_TYPES];
  const advancedFilterCount =
    (filters.priceMax ? 1 : 0) + (filters.verifiedOnly ? 1 : 0) + (filters.sort !== 'newest' ? 1 : 0);

  const ListHeader = (
    <View className="pb-4">
      <AppHeader />

      {/* Hero — the one full-bleed dark surface in the app; everything else
          stays flat/light per DESIGN.md §7. Reserved for this one moment. */}
      <View className="mx-4 overflow-hidden rounded-2xl bg-[#0F172A] px-5 pb-8 pt-6">
        <Text className="text-[10.5px] font-bold uppercase tracking-widest text-accent">
          Verified rentals in Cebu
        </Text>
        <Text className="mt-2 text-[26px] font-black leading-tight text-white">
          Find your next <Text className="italic text-accent">home</Text>
        </Text>
        <Text className="mt-1.5 text-[13px] text-white/70">
          Every listing reviewed, every landlord ID-verified.
        </Text>
      </View>

      {/* Overlaps the hero's bottom edge on purpose — a floating card
          bridging the dark and light sections, same as the prototype. Tapping
          it opens the full-screen search takeover (browse-by-type, popular
          areas, advanced filters) instead of typing inline — see /search. */}
      <SearchPill
        location={filters.location}
        filterCount={advancedFilterCount}
        onPress={() => router.push('/search')}
      />

      <View className="mx-4 mt-3 flex-row items-center gap-1.5">
        <CheckCircle2 size={13} color="#22C55E" />
        <Text className="text-[11.5px] font-medium text-text-muted">
          {total} listing{total === 1 ? '' : 's'} live · every landlord ID-verified
        </Text>
      </View>

      {featured.length > 0 && (
        <>
          <View className="mx-4 mb-3 mt-6 flex-row items-center justify-between">
            <Text className="text-[16px] font-bold text-text-primary">Featured near you</Text>
            <Text className="text-[12.5px] font-semibold text-primary">See all</Text>
          </View>
          <FlatList
            data={featured}
            keyExtractor={(item) => `featured-${item.property_id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            renderItem={({ item, index }) => (
              <StaggeredItem index={index}>
                <PropertyCard
                  property={item}
                  variant="featured"
                  onPress={() => router.push(`/property/${item.property_id}`)}
                  onToggleFavorite={() => handleToggleFavorite(item)}
                />
              </StaggeredItem>
            )}
          />
        </>
      )}

      <View className="mx-4 mb-3 mt-6 flex-row items-center justify-between">
        <Text className="text-[16px] font-bold text-text-primary">All listings</Text>
        <Text className="text-[12.5px] text-text-muted">{total} found</Text>
      </View>
      <FlatList
        data={typeFilterChips}
        keyExtractor={(item) => item.value || 'all'}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 4 }}
        renderItem={({ item }) => {
          const active = (filters.typeFilter ?? '') === item.value;
          return (
            <AnimatedPressable
              scaleTo={0.92}
              onPress={() => handleTypeFilterTap(item.value)}
              className={`rounded-full px-4 py-2 active:opacity-80 ${active ? 'bg-secondary' : 'border border-border bg-surface'}`}>
              <Text className={`text-[12.5px] font-semibold ${active ? 'text-white' : 'text-text-primary'}`}>
                {item.label}
              </Text>
            </AnimatedPressable>
          );
        }}
      />

      {error && (
        <View className="mx-4 mb-1 mt-4 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
          <Text className="text-xs font-semibold text-error">{error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#156F8C" />
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => String(item.property_id)}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center px-8 py-10">
              <Home size={32} color="#2AA7A1" />
              <Text className="mt-3 text-center text-base font-semibold text-text-primary">
                No properties found
              </Text>
              <Text className="mt-1 text-center text-sm text-text-muted">Try a different location.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <StaggeredItem index={index}>
              <PropertyCard
                property={item}
                onPress={() => router.push(`/property/${item.property_id}`)}
                onToggleFavorite={() => handleToggleFavorite(item)}
              />
            </StaggeredItem>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#156F8C" />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator className="mt-2" color="#156F8C" /> : null}
        />
      )}
    </SafeAreaView>
  );
}
