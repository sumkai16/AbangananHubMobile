import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

// Matches the web app's input styling: rounded-xl bordered field, bold teal
// label, teal focus ring (resources/views/auth/{login,register}.blade.php).
export function TextField({
  label,
  error,
  secureToggle,
  ...props
}: TextInputProps & { label: string; error?: string; secureToggle?: boolean }) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(!!secureToggle);

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[13px] font-bold text-primary">{label}</Text>
      <View className="relative">
        <TextInput
          className={`h-12 rounded-xl border bg-surface px-4 text-[14px] text-text-primary ${
            error ? 'border-error' : isFocused ? 'border-secondary' : 'border-border'
          }`}
          placeholderTextColor="#94A3B8"
          secureTextEntry={secureToggle ? isSecure : props.secureTextEntry}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {secureToggle && (
          <Pressable
            className="absolute right-3 top-0 h-12 items-center justify-center"
            onPress={() => setIsSecure((v) => !v)}
            hitSlop={8}>
            <Ionicons name={isSecure ? 'eye-outline' : 'eye-off-outline'} size={18} color="#64748B" />
          </Pressable>
        )}
      </View>
      {error && <Text className="mt-1 text-[11px] font-semibold text-error">{error}</Text>}
    </View>
  );
}
