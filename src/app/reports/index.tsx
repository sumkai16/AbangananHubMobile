import { useFocusEffect } from 'expo-router';
import { Flag } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaggeredItem } from '@/components/ui/staggered-item';
import { extractErrorMessage } from '@/lib/api-error';
import { listMyReports, type Report } from '@/lib/reports';
import { relativeTime } from '@/lib/relative-time';

function ReportRow({ report }: { report: Report }) {
  const target = report.property?.title ?? (report.reported_user
    ? `${report.reported_user.first_name} ${report.reported_user.last_name}`
    : 'Unknown');

  return (
    <View className="border-b border-border py-3.5">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-[13.5px] font-bold text-text-primary" numberOfLines={1}>
          {target}
        </Text>
        <Text
          className={`text-[11px] font-bold ${
            report.report_status === 'Resolved' ? 'text-success' : 'text-warning'
          }`}>
          {report.report_status}
        </Text>
      </View>
      <Text className="mt-1 text-[12.5px] text-text-muted" numberOfLines={2}>
        {report.report_reason}
      </Text>
      <Text className="mt-1 text-[11px] text-text-muted">{relativeTime(report.created_at)}</Text>
    </View>
  );
}

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await listMyReports();
      setReports(result.data);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {error && (
        <View className="mx-4 mb-3 mt-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
          <Text className="text-xs font-semibold text-error">{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#156F8C" />
        </View>
      ) : reports.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Flag size={32} color="#2AA7A1" />
          <Text className="mt-3 text-center text-base font-semibold text-text-primary">No reports filed</Text>
          <Text className="mt-1 text-center text-sm text-text-muted">
            Reports you submit about listings or users show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.report_id)}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <StaggeredItem index={index}>
              <ReportRow report={item} />
            </StaggeredItem>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#156F8C" />
          }
        />
      )}
    </SafeAreaView>
  );
}
