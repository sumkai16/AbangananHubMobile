import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { extractErrorMessage } from '@/lib/api-error';
import { REPORT_CATEGORIES, submitReport, type ReportCategory } from '@/lib/reports';

// Reached from a property (propertyId + propertyTitle params) today —
// user-target reporting has no entry point yet (no user profile screens
// on mobile besides the landlord's own KYC flow), so this form only
// covers `target_type: 'property'`. Extend when that entry point exists.
export default function SubmitReportScreen() {
  const router = useRouter();
  const { propertyId, propertyTitle } = useLocalSearchParams<{ propertyId?: string; propertyTitle?: string }>();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!category) {
      setError('Pick a category before submitting.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await submitReport({
        target_type: 'property',
        property_id: propertyId ? Number(propertyId) : undefined,
        category,
        details: details || undefined,
      });
      Alert.alert('Report submitted', 'Our team will review it shortly.');
      router.back();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="px-4 py-6" keyboardShouldPersistTaps="handled">
          {!!propertyTitle && (
            <Text className="mb-5 text-sm text-text-muted">
              Reporting <Text className="font-semibold text-text-primary">{propertyTitle}</Text>
            </Text>
          )}

          {error && (
            <View className="mb-4 flex-row items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
              <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs font-semibold text-error">{error}</Text>
            </View>
          )}

          <Text className="mb-2 text-[13px] font-bold text-primary">Category</Text>
          <View className="mb-5 gap-2">
            {REPORT_CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <AnimatedPressable
                  key={c}
                  scaleTo={0.98}
                  onPress={() => setCategory(c)}
                  className={`flex-row items-center justify-between rounded-xl border px-3.5 py-3 active:opacity-70 ${
                    active ? 'border-secondary bg-section' : 'border-border bg-surface'
                  }`}>
                  <Text className={`text-[13.5px] font-semibold ${active ? 'text-primary' : 'text-text-primary'}`}>
                    {c}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color="#156F8C" />}
                </AnimatedPressable>
              );
            })}
          </View>

          <TextField
            label="Details (optional)"
            placeholder="Tell us what happened"
            multiline
            numberOfLines={5}
            value={details}
            onChangeText={setDetails}
          />

          <Button title="Submit report" isLoading={isSubmitting} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
