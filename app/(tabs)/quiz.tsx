import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
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
  const [search, setSearch] = useState('');

  // Filter quizzes by their note title.
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.noteTitle.toLowerCase().includes(query));
  }, [items, search]);

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

      {/* Search bar (shown once there are quizzes to filter) */}
      {items.length > 0 && (
        <View style={styles.searchWrap}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FontAwesome5 name="search" size={14} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              value={search}
              onChangeText={setSearch}
              placeholder={t('quiz.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <FontAwesome5 name="times-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

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
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="search"
          title={t('quiz.noResultsTitle')}
          description={t('quiz.noResultsDesc')}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.noteId}
          renderItem={renderQuizCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
  searchWrap: {
    paddingHorizontal: theme.spacing.screenPadding,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: theme.radius.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    padding: 0,
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
