import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';
import { EmptyState } from '../../components/ui/EmptyState';

export default function QuizScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('quiz.title')}</Text>
      </View>

      {/* Empty state — real quiz list comes in Phase 5 */}
      <EmptyState
        icon="brain"
        title={t('quiz.emptyTitle')}
        description={t('quiz.emptyDesc')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 28,
  },
});
