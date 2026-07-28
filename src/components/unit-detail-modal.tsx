import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bed, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatRow } from '@/components/stat-row';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { BottomActionBar } from '@/components/ui/bottom-action-bar';
import { Button } from '@/components/ui/button';
import type { PropertyUnit } from '@/lib/properties';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ModalHeader({
  onBack,
  onClose,
  title,
}: {
  onBack?: () => void;
  onClose: () => void;
  title: string;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-border px-4 py-3.5">
      <View className="flex-1 flex-row items-center gap-2">
        {!!onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to units"
            className="h-11 w-11 items-center justify-center">
            <ChevronLeft size={22} color="#1F2937" />
          </Pressable>
        )}
        <Text className="flex-1 text-[15px] font-bold text-text-primary" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Pressable
        onPress={onClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="h-11 w-11 items-center justify-center">
        <X size={22} color="#1F2937" />
      </Pressable>
    </View>
  );
}

function UnitListRow({ unit, onPress }: { unit: PropertyUnit; onPress: () => void }) {
  const isAvailable = unit.availability_status === 'Available';
  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      className="flex-row items-center justify-between gap-3 border-b border-border py-4 active:opacity-80">
      <View className="flex-1">
        <Text className="text-[14.5px] font-bold text-text-primary">{unit.unit_label}</Text>
        <Text className="mt-0.5 text-[12.5px] text-text-muted">
          {[unit.unit_type, `₱${Number(unit.rental_fee).toLocaleString()}/month`].filter(Boolean).join(' · ')}
        </Text>
        <Text className={`mt-1 text-[11.5px] font-bold ${isAvailable ? 'text-success' : 'text-warning'}`}>
          {unit.availability_status}
        </Text>
      </View>
      <ChevronRight size={18} color="#64748B" />
    </AnimatedPressable>
  );
}

function UnitDetail({ unit, onSendInquiry }: { unit: PropertyUnit; onSendInquiry: () => void }) {
  const images = unit.media?.filter((m) => m.media_type === 'Image') ?? [];
  const isAvailable = unit.availability_status === 'Available';

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName={isAvailable ? 'pb-24' : 'pb-8'}>
        <View className="bg-section" style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.7 }}>
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
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.7 }}
                  contentFit="cover"
                />
              )}
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Bed size={40} color="#2AA7A1" />
            </View>
          )}
        </View>

        <View className="px-4 pt-5">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-lg font-black text-text-primary">{unit.unit_label}</Text>
            <Text className={`text-xs font-bold ${isAvailable ? 'text-success' : 'text-warning'}`}>
              {unit.availability_status}
            </Text>
          </View>
          {!!unit.unit_type && <Text className="mt-0.5 text-sm text-text-muted">{unit.unit_type}</Text>}

          <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <StatRow
              stats={[
                { label: 'Occupancy', value: `${unit.occupancy_limit}` },
                { label: 'Price / month', value: `₱${Number(unit.rental_fee).toLocaleString()}` },
              ]}
            />
          </View>

          {!!unit.description && (
            <View className="mt-5">
              <Text className="mb-1.5 text-base font-bold text-text-primary">About this unit</Text>
              <Text className="text-sm leading-relaxed text-text-primary">{unit.description}</Text>
            </View>
          )}

          {!!unit.amenities?.length && (
            <View className="mt-5">
              <Text className="mb-2 text-base font-bold text-text-primary">Unit amenities</Text>
              <View className="flex-row flex-wrap gap-2">
                {unit.amenities.map((amenity) => (
                  <View
                    key={amenity.amenity_id}
                    className="rounded-full border border-secondary/30 bg-section px-3 py-1.5">
                    <Text className="text-xs font-semibold text-text-primary">{amenity.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {isAvailable && (
        <BottomActionBar>
          <View className="flex-1">
            <Button title="Send Inquiry" variant="cta" onPress={onSendInquiry} />
          </View>
        </BottomActionBar>
      )}
    </View>
  );
}

// Full-screen modal mirroring the web app's unit picker + per-unit
// "slideout" — a list of a property's units, tapping one reveals its own
// media, occupancy/price, description, and unit-specific amenities
// (distinct from property-level amenities). No route/nav-stack entry;
// this is a true overlay, matching what was asked for.
export function UnitDetailModal({
  visible,
  onClose,
  units,
  propertyTitle,
}: {
  visible: boolean;
  onClose: () => void;
  units: PropertyUnit[];
  propertyTitle: string;
}) {
  const router = useRouter();
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);

  function handleClose() {
    setSelectedUnit(null);
    onClose();
  }

  function handleSendInquiry(unit: PropertyUnit) {
    handleClose();
    router.push({
      pathname: '/reservation/inquire',
      params: {
        unitId: String(unit.unit_id),
        propertyTitle,
        unitLabel: unit.unit_label,
        rentalFee: String(unit.rental_fee),
      },
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <ModalHeader
          title={selectedUnit ? selectedUnit.unit_label : propertyTitle}
          onBack={selectedUnit ? () => setSelectedUnit(null) : undefined}
          onClose={handleClose}
        />

        {selectedUnit ? (
          <UnitDetail unit={selectedUnit} onSendInquiry={() => handleSendInquiry(selectedUnit)} />
        ) : (
          <ScrollView contentContainerClassName="px-4">
            {units.map((unit) => (
              <UnitListRow key={unit.unit_id} unit={unit} onPress={() => setSelectedUnit(unit)} />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
