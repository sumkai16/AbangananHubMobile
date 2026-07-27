import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AuthHeader } from '@/components/ui/auth-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { extractErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-4 py-10"
        keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-md self-center rounded-2xl border border-border bg-surface p-6">
          <AuthHeader title="Welcome Back!" subtitle="Login to continue to AbangananHub" />

          {error && (
            <View className="mb-4 flex-row items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
              <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs font-semibold text-error">{error}</Text>
            </View>
          )}

          <TextField
            label="Email Address"
            placeholder="Enter your email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextField
            label="Password"
            placeholder="Enter your password"
            secureToggle
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Login"
            isLoading={isSubmitting}
            onPress={handleSubmit}
            className="mt-1"
          />

          <View className="mt-5 flex-row justify-center">
            <Text className="text-xs font-medium text-text-muted">Don&apos;t have an account? </Text>
            <Link href="/register" className="text-xs font-bold text-primary">
              Register here
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
