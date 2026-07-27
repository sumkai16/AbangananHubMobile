import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api-error';
import { DISPUTE_REASON_MAX, DISPUTE_REASON_MIN, disputeMoveIn } from '@/lib/escrow';

export default function DisputeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reservationId = Number(id);

  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The server requires 10–1000 chars. Enforced here too so the user finds
  // out while typing rather than on a rejected submit.
  const tooShort = reason.trim().length < DISPUTE_REASON_MIN;

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await disputeMoveIn(reservationId, reason.trim());
      Alert.alert(
        'Reported',
        'An administrator will review this. Your deposit stays on hold and the countdown is paused.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Could not submit', extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Report a move-in issue' }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-start gap-2.5 rounded-2xl bg-warning/10 p-4">
            <Ionicons name="alert-circle-outline" size={16} color="#B45309" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[12.5px] leading-relaxed text-[#B45309]">
              Use this if you haven&apos;t received the keys, or the unit isn&apos;t as agreed. Your
              deposit stays held and the countdown pauses while an administrator reviews it.
            </Text>
          </View>

          <Text className="mb-1.5 mt-5 text-[13px] font-bold text-primary">What happened?</Text>
          <TextInput
            className="min-h-32 rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text-primary"
            placeholder="Describe the problem — the landlord hasn't turned over the keys, the unit doesn't match the listing, etc."
            placeholderTextColor="#94A3B8"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={DISPUTE_REASON_MAX}
            textAlignVertical="top"
          />
          <View className="mb-6 mt-1.5 flex-row justify-between">
            <Text className="text-[11px] text-text-muted">
              {tooShort ? `At least ${DISPUTE_REASON_MIN} characters` : ' '}
            </Text>
            <Text className="text-[11px] text-text-muted">
              {reason.length}/{DISPUTE_REASON_MAX}
            </Text>
          </View>

          <Button
            title="Submit report"
            variant="danger"
            disabled={tooShort}
            isLoading={isSubmitting}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
