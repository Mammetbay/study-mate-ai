import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { Card } from '../../components/ui/Card';
import { useAppContext, useThemeColors } from '../../lib/AppContext';
import { theme } from '../../lib/theme';
import { getNotes } from '../../lib/db';
import { Note } from '../../types';

const RECENT_LIMIT = 3;

/** Consecutive days (ending today, with a one-day grace) that have a note. */
function computeStreak(dayKeys: Set<string>): number {
  const cursor = new Date();
  if (!dayKeys.has(cursor.toDateString())) {
    // No note today yet — allow the streak to still count up to yesterday.
    cursor.setDate(cursor.getDate() - 1);
    if (!dayKeys.has(cursor.toDateString())) return 0;
  }
  let streak = 0;
  while (dayKeys.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const db = useSQLiteContext();
  const { weeklyGoal } = useAppContext();

  const [notes, setNotes] = useState<Note[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        try {
          const data = await getNotes(db);
          if (isActive) setNotes(data);
        } catch (err) {
          console.error('Failed to load home data:', err);
        }
      };
      load();
      return () => {
        isActive = false;
      };
    }, [db])
  );

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  }, [t]);

  const { dayStreak, totalNotes, weeklyGoalCurrent, weeklyPercent, recentNotes } = useMemo(() => {
    const total = notes.length;
    const dayKeys = new Set(notes.map((n) => new Date(n.createdAt).toDateString()));
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyCurrent = notes.filter((n) => new Date(n.createdAt).getTime() >= weekAgo).length;
    return {
      dayStreak: computeStreak(dayKeys),
      totalNotes: total,
      weeklyGoalCurrent: weeklyCurrent,
      weeklyPercent: Math.min(100, Math.round((weeklyCurrent / weeklyGoal) * 100)),
      recentNotes: notes.slice(0, RECENT_LIMIT),
    };
  }, [notes, weeklyGoal]);

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
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/weekly-goal' as any)}>
          <Card style={styles.weeklyGoal}>
            <View style={styles.weeklyHeader}>
              <Text style={[styles.weeklyTitle, { color: colors.textPrimary }]}>
                {t('home.weeklyGoal')}
              </Text>
              <View style={styles.weeklyHeaderRight}>
                <Text style={[styles.weeklyPercent, { color: colors.accent }]}>
                  {weeklyPercent}%
                </Text>
                <FontAwesome5 name="chevron-right" size={12} color={colors.textSecondary} />
              </View>
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
                total: weeklyGoal,
              })}
            </Text>
          </Card>
        </TouchableOpacity>

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

        {recentNotes.length === 0 ? (
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
        ) : (
          <View style={styles.recentList}>
            {recentNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/note/${note.id}` as any)}
              >
                <Card style={styles.recentCard}>
                  <View style={[styles.recentIcon, { backgroundColor: `${colors.primary}22` }]}>
                    <FontAwesome5
                      name={note.sourceType === 'audio' ? 'microphone' : 'camera'}
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.recentBody}>
                    <Text
                      style={[styles.recentTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {note.title}
                    </Text>
                    <Text
                      style={[styles.recentMeta, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {note.tags.length > 0
                        ? `${note.tags[0]} · ${new Date(note.createdAt).toLocaleDateString()}`
                        : new Date(note.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={14} color={colors.textSecondary} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  weeklyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyPercent: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
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
  recentList: {
    gap: theme.spacing.cardGap,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentBody: {
    flex: 1,
  },
  recentTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 15,
    marginBottom: 2,
  },
  recentMeta: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
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
