import { useRouter } from 'expo-router';
import {
  Bed,
  Building2,
  Check,
  CheckCircle2,
  Home,
  MapPin,
  Square,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { DEFAULT_BROWSE_FILTERS, useBrowseFilters, type BrowseFilters } from '@/lib/browse-filters-context';
import type { PropertyFilters } from '@/lib/properties';

const BROWSE_TYPES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'Bedspace', label: 'Bedspace', icon: Bed },
  { value: 'Room', label: 'Room', icon: Square },
  { value: 'Apartment', label: 'Apartment', icon: Building2 },
  { value: 'House', label: 'House', icon: Home },
];

// Static for now — the server has no "distinct areas near you" endpoint yet;
// these are the same names the web app's location filter surfaces most.
// Revisit if/when that becomes a real endpoint.
const POPULAR_AREAS = ['Talisay City', 'Cebu City', 'Lahug / IT Park', 'Guadalupe', 'Apas'];

const SORT_OPTIONS: { value: NonNullable<PropertyFilters['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

function TypeTile({
  icon,
  label,
  active,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const Icon = icon;
  return (
    <AnimatedPressable
      scaleTo={0.92}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      className="flex-1 items-center gap-1.5 active:opacity-70">
      <View
        className={`h-12 w-12 items-center justify-center rounded-xl ${active ? 'bg-secondary' : 'bg-section'}`}>
        <Icon size={20} color={active ? '#FFFFFF' : '#156F8C'} />
      </View>
      <Text className={`text-[11px] font-semibold ${active ? 'text-primary' : 'text-text-primary'}`}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// Full-screen search takeover, reached by tapping the search bar on Browse.
// Hosts everything that used to live inline on the Browse feed — browse-by-
// type, popular areas, and advanced filters — so Browse itself stays to
// hero + featured + listings. Edits a local draft; nothing touches the
// shared BrowseFiltersContext (and re-fetches Browse) until "Search"/"Apply"
// is pressed, so backing out of this screen is a true cancel.
export default function SearchScreen() {
  const router = useRouter();
  const { filters, setFilters } = useBrowseFilters();
  const [draft, setDraft] = useState<BrowseFilters>(filters);

  function apply() {
    setFilters(draft);
    router.back();
  }

  function reset() {
    setDraft(DEFAULT_BROWSE_FILTERS);
  }

  function toggleType(type: string) {
    setDraft((d) => ({ ...d, typeFilter: d.typeFilter === type ? null : type }));
  }

  const hasAnyFilter =
    draft.location !== '' ||
    draft.typeFilter !== null ||
    draft.priceMax !== '' ||
    draft.verifiedOnly ||
    draft.sort !== 'newest';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center gap-2 px-4 pb-3 pt-2">
          <AnimatedPressable
            scaleTo={0.9}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close search"
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-70">
            <X size={22} color="#1F2937" />
          </AnimatedPressable>
          <View className="h-12 flex-1 flex-row items-center gap-2 rounded-full border border-border bg-surface px-4">
            <MapPin size={16} color="#64748B" />
            <TextInput
              autoFocus
              className="flex-1 text-[14px] text-text-primary"
              placeholder="Where to?"
              placeholderTextColor="#94A3B8"
              value={draft.location}
              onChangeText={(text) => setDraft((d) => ({ ...d, location: text }))}
              onSubmitEditing={apply}
              returnKeyType="search"
            />
            {!!draft.location && (
              <Pressable
                onPress={() => setDraft((d) => ({ ...d, location: '' }))}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear location">
                <XCircle size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView contentContainerClassName="px-4 pb-8" keyboardShouldPersistTaps="handled">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[16px] font-bold text-text-primary">Browse by type</Text>
            {hasAnyFilter && (
              <Pressable onPress={reset} hitSlop={8}>
                <Text className="text-[12.5px] font-semibold text-primary">Reset all</Text>
              </Pressable>
            )}
          </View>
          <View className="mb-6 flex-row gap-2">
            {BROWSE_TYPES.map((t) => (
              <TypeTile
                key={t.value}
                icon={t.icon}
                label={t.label}
                active={draft.typeFilter === t.value}
                onPress={() => toggleType(t.value)}
              />
            ))}
          </View>

          <Text className="mb-2 text-[16px] font-bold text-text-primary">Popular areas in Cebu</Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {POPULAR_AREAS.map((area) => {
              const active = draft.location === area;
              return (
                <AnimatedPressable
                  key={area}
                  scaleTo={0.93}
                  onPress={() => setDraft((d) => ({ ...d, location: active ? '' : area }))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`rounded-full border px-3.5 py-2 active:opacity-70 ${
                    active ? 'border-secondary bg-section' : 'border-border bg-surface'
                  }`}>
                  <Text className={`text-[12.5px] font-semibold ${active ? 'text-primary' : 'text-text-primary'}`}>
                    {area}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text className="mb-2 text-[16px] font-bold text-text-primary">Max price (₱/month)</Text>
          <TextInput
            className="mb-6 h-12 rounded-xl border border-border bg-surface px-3.5 text-[14px] text-text-primary"
            placeholder="No limit"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={draft.priceMax}
            onChangeText={(text) => setDraft((d) => ({ ...d, priceMax: text }))}
          />

          <AnimatedPressable
            scaleTo={0.98}
            onPress={() => setDraft((d) => ({ ...d, verifiedOnly: !d.verifiedOnly }))}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: draft.verifiedOnly }}
            className="mb-6 flex-row items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-3 active:opacity-70">
            <Text className="text-[14px] font-semibold text-text-primary">Verified landlords only</Text>
            <View
              className={`h-5 w-5 items-center justify-center rounded-md border ${
                draft.verifiedOnly ? 'border-secondary bg-secondary' : 'border-border bg-background'
              }`}>
              {draft.verifiedOnly && <Check size={14} color="#FFFFFF" />}
            </View>
          </AnimatedPressable>

          <Text className="mb-2 text-[16px] font-bold text-text-primary">Sort by</Text>
          <View className="gap-2">
            {SORT_OPTIONS.map((opt) => {
              const active = draft.sort === opt.value;
              return (
                <AnimatedPressable
                  key={opt.value}
                  scaleTo={0.98}
                  onPress={() => setDraft((d) => ({ ...d, sort: opt.value }))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  className={`flex-row items-center justify-between rounded-xl border px-3.5 py-3 active:opacity-70 ${
                    active ? 'border-secondary bg-section' : 'border-border bg-surface'
                  }`}>
                  <Text className={`text-[13.5px] font-semibold ${active ? 'text-primary' : 'text-text-primary'}`}>
                    {opt.label}
                  </Text>
                  {active && <CheckCircle2 size={18} color="#156F8C" />}
                </AnimatedPressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="border-t border-border px-4 pb-6 pt-3">
          <AnimatedPressable
            scaleTo={0.96}
            onPress={apply}
            accessibilityRole="button"
            accessibilityLabel="Search"
            className="h-12 items-center justify-center rounded-full bg-secondary active:opacity-80">
            <Text className="text-[14.5px] font-bold text-white">Search</Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
