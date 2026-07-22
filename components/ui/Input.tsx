import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  const colors = useThemeColors();

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: colors.border,
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: theme.radius.input,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
  },
});
