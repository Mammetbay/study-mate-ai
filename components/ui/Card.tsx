import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        theme.shadow.card,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
});
