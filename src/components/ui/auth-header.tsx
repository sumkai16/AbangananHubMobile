import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

// Matches the web app's auth branding block: teal icon badge + wordmark,
// bold teal title, muted subtitle (resources/views/auth/*.blade.php).
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-5">
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-secondary">
          <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
        </View>
        <Text className="text-base font-bold tracking-tight text-primary">AbangananHub</Text>
      </View>
      <Text className="text-xl font-black tracking-tight text-primary">{title}</Text>
      <Text className="mt-0.5 text-xs font-medium text-text-muted">{subtitle}</Text>
    </View>
  );
}
