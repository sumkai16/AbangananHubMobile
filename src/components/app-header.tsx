import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';

/**
 * The branded top bar — logo + wordmark, avatar shortcut to Profile. Only
 * the Browse tab carries this; every other tab uses a plain title (see the
 * prototype: Saved/Messages/Reservations open straight on their heading,
 * no repeated chrome).
 */
export function AppHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const initial = user?.first_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
      <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-secondary">
          <Home size={16} color="#FFFFFF" fill="#FFFFFF" />
        </View>
        <Text className="text-[15px] font-bold tracking-tight text-text-primary">AbangananHub</Text>
      </View>

      <Pressable
        onPress={() => router.push('/account')}
        hitSlop={8}
        className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-section active:scale-95 active:opacity-80">
        {user?.profile_picture ? (
          <Image source={{ uri: user.profile_picture }} style={{ width: 36, height: 36 }} contentFit="cover" />
        ) : (
          <Text className="text-[12px] font-bold text-primary">{initial}</Text>
        )}
      </Pressable>
    </View>
  );
}
