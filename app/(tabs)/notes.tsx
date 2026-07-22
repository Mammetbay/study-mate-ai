import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';
import { EmptyState } from '../../components/ui/EmptyState';

export default function NotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  // Phase 1: empty state — actual data will come from DB in Phase 2+
  const notes: never[] = [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('notes.title')}</Text>
      </View>

      {/* Content */}
      {notes.length === 0 ? (
        <EmptyState
          icon="file-alt"
          title={t('notes.emptyTitle')}
          description={t('notes.emptyDesc')}
        />
      ) : null}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, theme.shadow.fab]}
        onPress={() => router.push('/create-note')}
        activeOpacity={0.8}
      >
        <FontAwesome5 name="plus" size={22} color={colors.textOnPrimary} />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
