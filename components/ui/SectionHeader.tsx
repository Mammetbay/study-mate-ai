import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <Text style={[styles.header, { color: colors.primary }]}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  header: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },
});
