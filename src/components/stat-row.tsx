import { Text, View } from 'react-native';

export type Stat = {
  label: string;
  value: string | number;
  /** Text color class for the number — defaults to `text-text-primary`. */
  tone?: string;
};

/**
 * A flat row of stats separated by hairline vertical dividers — no boxed
 * tiles, no background. Shared by Reservations (Total/In Progress/Occupied)
 * and Profile (Saved/Reservations); see DESIGN.md §8 for why this replaced
 * the earlier bordered-card version.
 */
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <View className="flex-row items-center">
      {stats.map((stat, i) => (
        <View
          key={stat.label}
          className={`flex-1 items-center ${i > 0 ? 'border-l border-border' : ''}`}>
          <Text className={`text-[20px] font-black ${stat.tone ?? 'text-text-primary'}`}>
            {stat.value}
          </Text>
          <Text className="mt-0.5 text-[11px] font-semibold text-text-muted">{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
