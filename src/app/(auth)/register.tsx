import { Link } from 'expo-router';
import { AlertCircle, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { AuthHeader } from '@/components/ui/auth-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { extractErrorMessage, extractFieldErrors } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';

type Field = 'first_name' | 'last_name' | 'email' | 'contact_number' | 'password';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
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
      await signUp({
        first_name: firstName,
        last_name: lastName,
        email,
        contact_number: contactNumber,
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (err) {
      const errors = extractFieldErrors(err);
      if (errors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(errors).map(([field, messages]) => [field, messages[0]])
          )
        );
      } else {
        setError(extractErrorMessage(err));
      }
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
        contentContainerClassName="px-6 py-10"
        keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-md self-center">
          <AuthHeader
            size="large"
            title="Create Your Account"
            subtitle="Join AbangananHub and find your perfect place to stay."
          />

          {error && (
            <View className="mb-4 flex-row items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
              <AlertCircle size={16} color="#EF4444" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs font-semibold text-error">{error}</Text>
            </View>
          )}

          <TextField
            label="First Name"
            placeholder="First name"
            autoComplete="given-name"
            value={firstName}
            onChangeText={setFirstName}
            error={fieldErrors.first_name}
          />
          <TextField
            label="Last Name"
            placeholder="Last name"
            autoComplete="family-name"
            value={lastName}
            onChangeText={setLastName}
            error={fieldErrors.last_name}
          />
          <TextField
            label="Email Address"
            placeholder="Enter your email address"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
          />
          <TextField
            label="Contact Number"
            placeholder="Enter your contact number"
            autoComplete="tel"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
            error={fieldErrors.contact_number}
          />
          <TextField
            label="Password"
            placeholder="Create a password"
            secureToggle
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
          />
          <TextField
            label="Confirm Password"
            placeholder="Confirm your password"
            secureToggle
            autoComplete="new-password"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
          />

          <View className="mb-4 flex-row items-start gap-2.5 rounded-xl border border-secondary/20 bg-section p-2.5">
            <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-lg bg-secondary">
              <ShieldCheck size={12} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-primary">
                Your security is our priority
              </Text>
              <Text className="text-[11px] font-semibold leading-tight text-text-muted">
                We protect your data and identity seamlessly.
              </Text>
            </View>
          </View>

          <Button title="Create Account" isLoading={isSubmitting} onPress={handleSubmit} />

          <View className="mt-5 flex-row justify-center">
            <Text className="text-xs font-medium text-text-muted">Already have an account? </Text>
            <Link href="/login" className="text-xs font-bold text-primary">
              Login
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
