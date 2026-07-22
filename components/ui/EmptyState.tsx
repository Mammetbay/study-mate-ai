import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
        <FontAwesome5 name={icon} size={32} color={colors.textSecondary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
