import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { getNotesWithQuizzes, NoteWithQuizInfo } from '../../lib/db';

export default function QuizScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const db = useSQLiteContext();

  const [items, setItems] = useState<NoteWithQuizInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchQuizzes = async () => {
        try {
          const data = await getNotesWithQuizzes(db);
          if (isActive) setItems(data);
        } catch (error) {
          console.error('Failed to load quizzes:', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchQuizzes();

      return () => {
        isActive = false;
      };
    }, [db])
  );

  const renderQuizCard = ({ item }: { item: NoteWithQuizInfo }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/quiz/${item.noteId}` as any)}
      style={styles.cardContainer}
    >
      <Card style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FontAwesome5 name="brain" size={12} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {t('quiz.questionsCount', { count: item.questionCount })}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.noteTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.noteTitle}
        </Text>
        <View style={styles.startRow}>
          <Text style={[styles.startText, { color: colors.primary }]}>{t('quiz.startQuiz')}</Text>
          <FontAwesome5 name="chevron-right" size={12} color={colors.primary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('quiz.title')}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="brain"
          title={t('quiz.emptyTitle')}
          description={t('quiz.emptyDesc')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.noteId}
          renderItem={renderQuizCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: theme.spacing.cardGap,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
  },
  dateText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
  },
  noteTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    marginBottom: 12,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
});
