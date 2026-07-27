import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// No GET /notifications endpoint exists yet (M10, see account.tsx's punch
// list) — this is an honest empty state, not a fetch that's been stubbed
// out. Wire up the real list the moment the server work lands.
export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-black tracking-tight text-text-primary">Notifications</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="notifications-outline" size={32} color="#2AA7A1" />
        <Text className="mt-3 text-center text-base font-semibold text-text-primary">
          No notifications yet
        </Text>
        <Text className="mt-1 text-center text-sm text-text-muted">
          Updates on your reservations and messages will show up here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
