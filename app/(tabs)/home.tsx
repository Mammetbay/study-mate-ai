import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { useThemeColors } from '../../lib/AppContext';
import { theme } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  }, [t]);

  // Mock data for Phase 1 UI demonstration
  const dayStreak = 0;
  const totalNotes = 0;
  const weeklyGoalCurrent = 0;
  const weeklyGoalTotal = 25;
  const weeklyPercent = totalNotes > 0
    ? Math.round((weeklyGoalCurrent / weeklyGoalTotal) * 100)
    : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {t('home.userName')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notifButton, { backgroundColor: colors.surface }]}
          >
            <FontAwesome5 name="bell" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Day Streak */}
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <FontAwesome5 name="fire" size={20} color="rgba(0,0,0,0.6)" />
            <Text style={styles.statNumber}>{dayStreak}</Text>
            <Text style={styles.statLabel}>{t('home.dayStreak')}</Text>
          </View>

          {/* Total Notes */}
          <Card style={styles.statCard}>
            <FontAwesome5 name="file-alt" size={20} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{totalNotes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('home.totalNotes')}
            </Text>
          </Card>
        </View>

        {/* Weekly Goal */}
        <Card style={styles.weeklyGoal}>
          <View style={styles.weeklyHeader}>
            <Text style={[styles.weeklyTitle, { color: colors.textPrimary }]}>
              {t('home.weeklyGoal')}
            </Text>
            <Text style={[styles.weeklyPercent, { color: colors.accent }]}>
              {weeklyPercent}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.accent,
                  width: `${weeklyPercent}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.weeklySubtext, { color: colors.textSecondary }]}>
            {t('home.notesReviewed', {
              current: weeklyGoalCurrent,
              total: weeklyGoalTotal,
            })}
          </Text>
        </Card>

        {/* Recent Notes */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('home.recentNotes')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/notes')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              {t('common.seeAll')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty state for recent notes */}
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <FontAwesome5 name="book-open" size={28} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {t('home.noNotesYet')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {t('home.noNotesDesc')}
            </Text>
          </View>
        </Card>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    marginBottom: 2,
  },
  userName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 28,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.cardGap,
    marginBottom: theme.spacing.cardGap,
  },
  statCard: {
    flex: 1,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    gap: 8,
  },
  statNumber: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 36,
    color: '#000000',
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  weeklyGoal: {
    marginBottom: theme.spacing.xl,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
  },
  weeklyPercent: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    minWidth: 0,
  },
  weeklySubtext: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 20,
  },
  seeAll: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
    marginTop: 8,
  },
  emptyDesc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
