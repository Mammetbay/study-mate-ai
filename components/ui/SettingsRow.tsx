import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  showChevron = false,
}: SettingsRowProps) {
  const colors = useThemeColors();

  const content = (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        <FontAwesome5 name={icon} size={16} color={colors.primary} style={styles.icon} />
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <View style={styles.right}>
        {value && (
          <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>
        )}
        {rightElement}
        {showChevron && (
          <FontAwesome5
            name="chevron-right"
            size={12}
            color={colors.textSecondary}
            style={styles.chevron}
          />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 24,
    textAlign: 'center',
    marginRight: 12,
  },
  label: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    marginRight: 8,
  },
  chevron: {
    marginLeft: 4,
  },
});
