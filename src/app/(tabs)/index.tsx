import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { PropertyCard } from '@/components/property-card';
import { extractErrorMessage } from '@/lib/api-error';
import { listProperties, toggleFavorite, type Paginated, type Property } from '@/lib/properties';

const BROWSE_TYPES: { value: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'Bedspace', label: 'Bedspace', icon: 'bed-outline' },
  { value: 'Room', label: 'Room', icon: 'square-outline' },
  { value: 'Apartment', label: 'Apartment', icon: 'business-outline' },
  { value: 'House', label: 'House', icon: 'home-outline' },
];

// Static for now — the server has no "distinct areas near you" endpoint yet;
// these are the same names the web app's location filter surfaces most.
// Revisit if/when that becomes a real endpoint.
const POPULAR_AREAS = ['Talisay City', 'Cebu City', 'Lahug / IT Park', 'Guadalupe', 'Apas'];

function TypeTile({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center gap-1.5 active:opacity-70">
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-section">
        <Ionicons name={icon} size={20} color="#156F8C" />
      </View>
      <Text className="text-[11px] font-semibold text-text-primary">{label}</Text>
    </Pressable>
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [location, setLocation] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
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

  const fetchPage = useCallback(
    async (pageToLoad: number, query: string, type: string | null, replace: boolean) => {
      const requestId = ++latestRequestId.current;
      try {
        const result: Paginated<Property> = await listProperties({
          location: query || undefined,
          type: type || undefined,
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
    },
    []
  );

  useEffect(() => {
    setIsLoading(true);
    fetchPage(1, '', null, true).finally(() => setIsLoading(false));
    // Only the initial load runs here — search/filter re-fetches happen from
    // their own handlers, not on every keystroke or tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runQuery(nextLocation: string, nextType: string | null) {
    setIsLoading(true);
    await fetchPage(1, nextLocation, nextType, true);
    setIsLoading(false);
  }

  function handleAreaTap(area: string) {
    setLocation(area);
    runQuery(area, typeFilter);
  }

  function handleTypeFilterTap(type: string) {
    const next = typeFilter === type ? null : type || null;
    setTypeFilter(next);
    runQuery(location, next);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchPage(1, location, typeFilter, true);
    setIsRefreshing(false);
  }

  async function handleLoadMore() {
    if (isLoadingMore || page >= lastPage) return;
    setIsLoadingMore(true);
    await fetchPage(page + 1, location, typeFilter, false);
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
          bridging the dark and light sections, same as the prototype. */}
      <View className="mx-4 -mt-5 h-12 flex-row items-center gap-2 rounded-full border border-border bg-surface px-4">
        <Ionicons name="location-outline" size={16} color="#64748B" />
        <TextInput
          className="flex-1 text-[14px] text-text-primary"
          placeholder="Search by location..."
          placeholderTextColor="#94A3B8"
          value={location}
          onChangeText={setLocation}
          onSubmitEditing={() => runQuery(location, typeFilter)}
          returnKeyType="search"
        />
        <Pressable
          onPress={() => runQuery(location, typeFilter)}
          hitSlop={6}
          className="h-8 w-8 items-center justify-center rounded-full bg-secondary active:opacity-80">
          <Ionicons name="search" size={15} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="mx-4 mt-3 flex-row items-center gap-1.5">
        <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
        <Text className="text-[11.5px] font-medium text-text-muted">
          {total} listing{total === 1 ? '' : 's'} live · every landlord ID-verified
        </Text>
      </View>

      <Text className="mx-4 mb-3 mt-6 text-[16px] font-bold text-text-primary">Browse by type</Text>
      <View className="mx-4 flex-row gap-2">
        {BROWSE_TYPES.map((t) => (
          <TypeTile key={t.value} icon={t.icon} label={t.label} onPress={() => handleTypeFilterTap(t.value)} />
        ))}
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
            renderItem={({ item }) => (
              <PropertyCard
                property={item}
                variant="featured"
                onPress={() => router.push(`/property/${item.property_id}`)}
                onToggleFavorite={() => handleToggleFavorite(item)}
              />
            )}
          />
        </>
      )}

      <Text className="mx-4 mb-3 mt-6 text-[16px] font-bold text-text-primary">Popular areas in Cebu</Text>
      <View className="mx-4 flex-row flex-wrap gap-2">
        {POPULAR_AREAS.map((area) => (
          <Pressable
            key={area}
            onPress={() => handleAreaTap(area)}
            className={`rounded-full border px-3.5 py-2 active:opacity-70 ${
              location === area ? 'border-secondary bg-section' : 'border-border bg-surface'
            }`}>
            <Text
              className={`text-[12.5px] font-semibold ${location === area ? 'text-primary' : 'text-text-primary'}`}>
              {area}
            </Text>
          </Pressable>
        ))}
      </View>

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
          const active = (typeFilter ?? '') === item.value;
          return (
            <Pressable
              onPress={() => handleTypeFilterTap(item.value)}
              className={`rounded-full px-4 py-2 active:opacity-80 ${active ? 'bg-secondary' : 'border border-border bg-surface'}`}>
              <Text className={`text-[12.5px] font-semibold ${active ? 'text-white' : 'text-text-primary'}`}>
                {item.label}
              </Text>
            </Pressable>
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
              <Ionicons name="home-outline" size={32} color="#2AA7A1" />
              <Text className="mt-3 text-center text-base font-semibold text-text-primary">
                No properties found
              </Text>
              <Text className="mt-1 text-center text-sm text-text-muted">Try a different location.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.property_id}`)}
              onToggleFavorite={() => handleToggleFavorite(item)}
            />
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
