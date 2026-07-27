import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api-error';
import { getTenancy, type PeriodStatus, type RentPeriod, type Tenancy } from '@/lib/tenancy';

const peso = (n: number) => `₱${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const PERIOD_TONE: Record<PeriodStatus, { bg: string; text: string; label: string }> = {
  paid: { bg: 'bg-success/10', text: 'text-success', label: 'Paid' },
  partial: { bg: 'bg-warning/10', text: 'text-[#B45309]', label: 'Partial' },
  due: { bg: 'bg-warning/10', text: 'text-[#B45309]', label: 'Due' },
  overdue: { bg: 'bg-error/10', text: 'text-error', label: 'Overdue' },
  upcoming: { bg: 'bg-border', text: 'text-text-muted', label: 'Upcoming' },
};

function PeriodRow({ period }: { period: RentPeriod }) {
  const tone = PERIOD_TONE[period.status] ?? PERIOD_TONE.upcoming;

  return (
    <View className="flex-row items-center justify-between gap-3 border-t border-border py-3">
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-text-primary">{period.label}</Text>
        <Text className="mt-0.5 text-[11.5px] text-text-muted">
          Due {new Date(period.due_on).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          {period.paid > 0 && period.balance > 0 ? ` · ${peso(period.paid)} paid` : ''}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-[14px] font-bold text-text-primary">
          {peso(period.balance > 0 ? period.balance : period.expected)}
        </Text>
        <View className={`mt-1 rounded-full px-2 py-0.5 ${tone.bg}`}>
          <Text className={`text-[10.5px] font-bold ${tone.text}`}>{tone.label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TenancyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reservationId = Number(id);

  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTenancy(await getTenancy(reservationId));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [reservationId]);

  // Reloads on focus so returning from the pay screen shows the settled
  // period without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      load().finally(() => setIsLoading(false));
    }, [load])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: 'Rent' }} />
        <ActivityIndicator color="#156F8C" />
      </View>
    );
  }

  if (error || !tenancy) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ title: 'Rent' }} />
        <Ionicons name="alert-circle-outline" size={32} color="#94A3B8" />
        <Text className="mt-3 text-center text-sm font-semibold text-error">
          {error ?? 'Could not load your rent ledger'}
        </Text>
      </View>
    );
  }

  const { summary, periods, other_charges, payable_period } = tenancy;
  const isSettled = summary.outstanding <= 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-10"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#156F8C" />
      }>
      <Stack.Screen options={{ title: 'Rent' }} />

      {/* Headline: what's owed, or that nothing is. */}
      <View className="rounded-2xl border border-border bg-surface p-5">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          {isSettled ? 'Rent status' : 'Outstanding balance'}
        </Text>
        <Text
          className={`mt-1 text-[32px] font-black tracking-tight ${
            summary.overdueCount > 0 ? 'text-error' : 'text-text-primary'
          }`}>
          {isSettled ? 'All paid' : peso(summary.outstanding)}
        </Text>
        <Text className="mt-1 text-[12.5px] text-text-muted">
          {peso(summary.monthlyRent)} monthly · due on day {summary.dueDay}
          {summary.overdueCount > 0
            ? ` · ${summary.overdueCount} month${summary.overdueCount > 1 ? 's' : ''} overdue`
            : ''}
        </Text>

        {!!payable_period && (
          <View className="mt-4">
            <Button
              title={`Pay ${payable_period.label} — ${peso(payable_period.balance)}`}
              variant="cta"
              icon="card-outline"
              onPress={() => router.push(`/reservation/${reservationId}/pay-rent`)}
            />
          </View>
        )}
      </View>

      <Text className="mb-1 mt-6 text-[11px] font-bold uppercase tracking-wider text-text-muted">
        Monthly rent
      </Text>
      <View className="rounded-2xl border border-border bg-surface px-4">
        {periods.length === 0 ? (
          <Text className="py-6 text-center text-[13px] text-text-muted">
            No billing periods yet.
          </Text>
        ) : (
          periods.map((p) => <PeriodRow key={p.label} period={p} />)
        )}
      </View>

      {other_charges.length > 0 && (
        <>
          <Text className="mb-1 mt-6 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Deposits & other charges
          </Text>
          <View className="rounded-2xl border border-border bg-surface px-4">
            {other_charges.map((c) => (
              <View
                key={c.payment_id}
                className="flex-row items-center justify-between gap-3 border-t border-border py-3">
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-text-primary">
                    {c.payment_type} payment
                  </Text>
                  <Text className="mt-0.5 text-[11.5px] text-text-muted">
                    {c.paid_at ? new Date(c.paid_at).toLocaleDateString() : c.status}
                    {' · '}
                    {c.payment_method}
                  </Text>
                </View>
                <Text className="text-[14px] font-bold text-text-primary">{peso(Number(c.amount))}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
