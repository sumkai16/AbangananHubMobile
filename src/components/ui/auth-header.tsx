import { ShieldCheck } from 'lucide-react-native';
import { Text, View } from 'react-native';

// Matches the web app's auth branding block: teal icon badge + wordmark,
// bold teal title, muted subtitle (resources/views/auth/*.blade.php).
// `size="large"` is the full-screen onboarding treatment (login/register);
// `"compact"` (default) is for any future boxed-card use of this header.
export function AuthHeader({
  title,
  subtitle,
  size = 'compact',
}: {
  title: string;
  subtitle: string;
  size?: 'compact' | 'large';
}) {
  const isLarge = size === 'large';

  return (
    <View className={isLarge ? 'mb-8 mt-4' : 'mb-5'}>
      <View className={`flex-row items-center gap-2 ${isLarge ? 'mb-6' : 'mb-3'}`}>
        <View
          className={`items-center justify-center rounded-lg bg-secondary ${isLarge ? 'h-11 w-11' : 'h-8 w-8'}`}>
          <ShieldCheck size={isLarge ? 20 : 16} color="#FFFFFF" />
        </View>
        <Text className={`font-bold tracking-tight text-primary ${isLarge ? 'text-lg' : 'text-base'}`}>
          AbangananHub
        </Text>
      </View>
      <Text className={`font-black tracking-tight text-primary ${isLarge ? 'text-[28px]' : 'text-xl'}`}>
        {title}
      </Text>
      <Text className={`mt-1 font-medium text-text-muted ${isLarge ? 'text-sm' : 'text-xs'}`}>
        {subtitle}
      </Text>
    </View>
  );
}
