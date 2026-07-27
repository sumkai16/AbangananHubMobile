import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { extractErrorMessage, extractFieldErrors } from '@/lib/api-error';
import { createReservation } from '@/lib/reservations';

export default function InquireScreen() {
  const router = useRouter();
  const { unitId, propertyTitle, unitLabel, rentalFee } = useLocalSearchParams<{
    unitId: string;
    propertyTitle?: string;
    unitLabel?: string;
    rentalFee?: string;
  }>();

  const [moveInDate, setMoveInDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setDateError(undefined);
    setIsSubmitting(true);
    try {
      await createReservation({
        unit_id: Number(unitId),
        target_move_in_date: moveInDate || undefined,
        message: message || undefined,
        remarks: message || undefined,
      });
      Alert.alert('Inquiry sent', 'The landlord has been notified.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors?.target_move_in_date) {
        setDateError(fieldErrors.target_move_in_date[0]);
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Send Inquiry', presentation: 'modal' }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
          <View className="mb-5 rounded-xl border border-border bg-surface p-4">
            <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
              {propertyTitle}
            </Text>
            <Text className="mt-0.5 text-xs text-text-muted">{unitLabel}</Text>
            {!!rentalFee && (
              <Text className="mt-1 text-sm font-semibold text-text-primary">
                ₱{Number(rentalFee).toLocaleString()}
                <Text className="text-xs font-normal text-text-muted"> /month</Text>
              </Text>
            )}
          </View>

          {error && (
            <View className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
              <Text className="text-xs font-semibold text-error">{error}</Text>
            </View>
          )}

          <Text className="mb-1.5 text-[13px] font-bold text-primary">
            Target move-in date (optional)
          </Text>
          <TextInput
            className={`mb-1 h-12 rounded-xl border bg-surface px-4 text-[14px] text-text-primary ${
              dateError ? 'border-error' : 'border-border'
            }`}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            value={moveInDate}
            onChangeText={setMoveInDate}
          />
          {dateError && <Text className="mb-3 text-[11px] font-semibold text-error">{dateError}</Text>}
          {!dateError && <View className="mb-3" />}

          <Text className="mb-1.5 text-[13px] font-bold text-primary">
            Message to the landlord (optional)
          </Text>
          <TextInput
            className="mb-1 min-h-24 rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text-primary"
            placeholder="Introduce yourself, ask a question, or request a viewing..."
            placeholderTextColor="#94A3B8"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
          <Text className="mb-5 text-right text-[11px] text-text-muted">{message.length}/300</Text>

          <Button title="Send Inquiry" isLoading={isSubmitting} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
