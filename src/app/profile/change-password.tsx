import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { extractErrorMessage, extractFieldErrors } from '@/lib/api-error';
import { updatePassword } from '@/lib/profile';

type Field = 'current_password' | 'password';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await updatePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      Alert.alert('Password updated', 'Use your new password next time you sign in.');
      router.back();
    } catch (err) {
      const errors = extractFieldErrors(err);
      if (errors) {
        setFieldErrors(
          Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]))
        );
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="px-4 py-6" keyboardShouldPersistTaps="handled">
          {error && (
            <View className="mb-4 flex-row items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
              <AlertCircle size={16} color="#EF4444" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs font-semibold text-error">{error}</Text>
            </View>
          )}

          <TextField
            label="Current Password"
            secureToggle
            autoComplete="current-password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            error={fieldErrors.current_password}
          />
          <TextField
            label="New Password"
            secureToggle
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
          />
          <TextField
            label="Confirm New Password"
            secureToggle
            autoComplete="new-password"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
          />

          <Button title="Update password" isLoading={isSubmitting} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
