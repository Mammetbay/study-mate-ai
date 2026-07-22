import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  icon,
  style,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  const bgStyle = isPrimary
    ? { backgroundColor: colors.primary }
    : isDanger
      ? { backgroundColor: 'transparent', borderColor: colors.error, borderWidth: 1 }
      : { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1 };

  const textColor = isPrimary
    ? colors.textOnPrimary
    : isDanger
      ? colors.error
      : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.button, bgStyle, props.disabled && { opacity: 0.5 }, style]}
      disabled={props.disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.button,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    marginRight: 0,
  },
  label: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
  },
});
