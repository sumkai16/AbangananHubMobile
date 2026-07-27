import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { TextField } from '@/components/ui/text-field';
import { extractErrorMessage } from '@/lib/api-error';
import { submitReview } from '@/lib/reviews';

export default function SubmitReviewScreen() {
  const router = useRouter();
  const { propertyId, propertyTitle } = useLocalSearchParams<{ propertyId: string; propertyTitle: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      setError('Pick a star rating before submitting.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await submitReview({
        property_id: Number(propertyId),
        rating,
        review_comment: comment || undefined,
      });
      Alert.alert('Review submitted', 'Thanks for sharing your experience.');
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
              Reviewing <Text className="font-semibold text-text-primary">{propertyTitle}</Text>
            </Text>
          )}

          {error && (
            <View className="mb-4 flex-row items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
              <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs font-semibold text-error">{error}</Text>
            </View>
          )}

          <Text className="mb-2 text-[13px] font-bold text-primary">Your rating</Text>
          <View className="mb-5">
            <StarRating value={rating} onChange={setRating} size={30} />
          </View>

          <TextField
            label="Comment (optional)"
            placeholder="How was your stay?"
            multiline
            numberOfLines={5}
            value={comment}
            onChangeText={setComment}
          />

          <Button title="Submit review" isLoading={isSubmitting} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
