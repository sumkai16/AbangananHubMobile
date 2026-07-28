import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { extractErrorMessage, extractFieldErrors } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/profile';

type Field = 'first_name' | 'last_name' | 'contact_number' | 'bio';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [contactNumber, setContactNumber] = useState((user?.contact_number as string) ?? '');
  const [bio, setBio] = useState((user?.bio as string) ?? '');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber || null,
        bio: bio || null,
      });
      await refreshProfile();
      Alert.alert('Saved', 'Your profile was updated.');
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
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            error={fieldErrors.first_name}
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            error={fieldErrors.last_name}
          />
          <TextField
            label="Contact Number"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
            error={fieldErrors.contact_number}
          />
          <TextField
            label="Bio"
            placeholder="Tell landlords a little about yourself"
            multiline
            numberOfLines={4}
            value={bio}
            onChangeText={setBio}
            error={fieldErrors.bio}
          />

          <Button title="Save changes" isLoading={isSubmitting} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
