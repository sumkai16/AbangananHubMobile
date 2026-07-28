import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AlertCircle,
  Building2,
  ChevronRight,
  Flag,
  Heart,
  Lock,
  Star,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatRow } from '@/components/stat-row';
import { useAuth } from '@/lib/auth-context';
import { listFavorites } from '@/lib/favorites';
import { listReservations } from '@/lib/reservations';

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="mb-1 mt-5 px-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">
      {label}
    </Text>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  const textClass = tone === 'danger' ? 'text-error' : 'text-text-primary';
  const iconColor = tone === 'danger' ? '#EF4444' : '#64748B';
  const IconComponent = icon;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-1 py-3.5 active:bg-section">
      <IconComponent size={18} color={iconColor} />
      <Text className={`flex-1 text-[14px] font-semibold ${textClass}`}>{label}</Text>
      <ChevronRight size={16} color={iconColor} />
    </Pressable>
  );
}

const NOT_BUILT_YET = (thing: string) => () =>
  Alert.alert('Coming soon', `${thing} isn't built yet.`);

export default function MoreScreen() {
  const router = useRouter();
  const { user, isLandlord, signOut } = useAuth();
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [reservationCount, setReservationCount] = useState<number | null>(null);

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : 'Your account';
  const initial = user?.first_name?.charAt(0).toUpperCase() ?? '?';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  // Neither count lives on GET /profile — cheap enough to fetch on focus
  // rather than adding a server-side aggregate for two numbers.
  useFocusEffect(
    useCallback(() => {
      listFavorites()
        .then((f) => setSavedCount(f.length))
        .catch(() => setSavedCount(null));
      listReservations('all')
        .then((r) => setReservationCount(r.counts.all))
        .catch(() => setReservationCount(null));
    }, [])
  );

  function handleSignOut() {
    // signOut() clears the local token even if /auth/logout fails (e.g. the
    // token is already dead) — the user's intent is to be signed out on this
    // device regardless of what the server says.
    Alert.alert('Sign out?', 'You can log back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="pb-8">
        <View className="flex-row items-center gap-3 px-4 pb-4 pt-2">
          {user?.profile_picture ? (
            <Image
              source={{ uri: user.profile_picture }}
              style={{ height: 52, width: 52, borderRadius: 26 }}
              contentFit="cover"
            />
          ) : (
            <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-secondary">
              <Text className="text-lg font-black text-white">{initial}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-[17px] font-black text-text-primary" numberOfLines={1}>
              {fullName}
            </Text>
            <Text className="mt-0.5 text-[12.5px] text-text-muted" numberOfLines={1}>
              {isLandlord ? 'Landlord' : 'Tenant'}
              {memberSince ? ` · Member since ${memberSince}` : ''}
            </Text>
          </View>
        </View>

        <View className="mx-4">
          <StatRow
            stats={[
              { label: 'Saved', value: savedCount ?? '—' },
              { label: 'Reservations', value: reservationCount ?? '—' },
            ]}
          />
        </View>

        <View className="mx-4">
          {/* This is deliberately a punch list, not just a profile card —
              every row past "Edit profile" is a module the WBS has already
              named (M9 reviews, M12 reports) that has no screen yet. Each
              opens a "coming soon" alert rather than doing nothing, so
              tapping one is honest about what's missing instead of reading
              as a dead button. Update a row to a real onPress the moment
              its screen ships — don't leave it pointing at NOT_BUILT_YET
              after that. Notifications moved to its own tab (2026-07-27);
              Saved lives here since it's a secondary action, not a screen
              tenants live in day to day. */}
          <SectionLabel label="Activity" />
          <MenuRow icon={Heart} label="Saved" onPress={() => router.push('/saved')} />
          <MenuRow icon={Star} label="My Reviews" onPress={NOT_BUILT_YET('Reviews')} />
          <MenuRow icon={Flag} label="My Reports" onPress={() => router.push('/reports')} />

          <SectionLabel label="Account" />
          <MenuRow icon={User} label="Edit profile" onPress={() => router.push('/profile/edit')} />
          <MenuRow
            icon={Lock}
            label="Change password"
            onPress={() => router.push('/profile/change-password')}
          />

          {/* No landlord dashboard exists yet (M3) — this is deliberately
              the only landlord-facing thing on mobile today: the entry
              point into the one landlord flow that's built (KYC via
              WebView, M3.6), and a statement of fact for a landlord
              waiting on the rest. */}
          {isLandlord ? (
            <View className="border-b border-border py-3.5">
              <Text className="text-[13px] font-semibold text-text-primary">
                You&apos;re a verified landlord
              </Text>
              <Text className="mt-1 text-[12px] text-text-muted">
                Property and unit management are coming to the app soon — manage your listings on
                the website for now.
              </Text>
            </View>
          ) : (
            <MenuRow
              icon={Building2}
              label="Become a Landlord"
              onPress={() => router.push('/landlord/verification')}
            />
          )}

          <MenuRow
            icon={AlertCircle}
            label="Report a problem"
            onPress={NOT_BUILT_YET('In-app reporting')}
          />

          <Pressable onPress={handleSignOut} className="mt-5 px-1 py-3.5 active:opacity-70">
            <Text className="text-[14px] font-semibold text-error">Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
