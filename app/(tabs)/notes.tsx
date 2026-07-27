import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { getNotes, getAllTags } from '../../lib/db';
import { useSQLiteContext } from 'expo-sqlite';
import { Note } from '../../types';

const ALL_TAGS = '__all__';

export default function NotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const db = useSQLiteContext();

  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string>(ALL_TAGS);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchNotes = async () => {
        try {
          const [data, allTags] = await Promise.all([getNotes(db), getAllTags(db)]);
          if (isActive) {
            setNotes(data);
            setTags(allTags);
            // Reset the tag filter if the selected one no longer exists.
            setActiveTag((prev) =>
              prev === ALL_TAGS || allTags.includes(prev) ? prev : ALL_TAGS
            );
          }
        } catch (error) {
          console.error('Failed to load notes:', error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchNotes();

      return () => {
        isActive = false;
      };
    }, [db])
  );

  // Filter by note title (search) and the selected tag.
  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesTag = activeTag === ALL_TAGS || note.tags.includes(activeTag);
      if (!matchesTag) return false;
      if (!query) return true;
      return note.title.toLowerCase().includes(query);
    });
  }, [notes, search, activeTag]);

  const renderNoteCard = ({ item }: { item: Note }) => {
    // Prefer the AI summary as the card preview; fall back to the transcript.
    const preview = item.summary.trim() ? item.summary : item.transcript;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/note/${item.id}` as any)}
        style={styles.cardContainer}
      >
        <Card style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeGroup}>
              <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <FontAwesome5
                  name={item.sourceType === 'audio' ? 'microphone' : 'camera'}
                  size={12}
                  color={colors.primary}
                />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  {item.sourceType === 'audio' ? t('notes.lecture') : t('notes.photo')}
                </Text>
              </View>
              {item.tags.slice(0, 2).map((tag) => (
                <View
                  key={tag}
                  style={[styles.badge, { backgroundColor: `${colors.accent}22`, borderColor: colors.accent }]}
                >
                  <FontAwesome5 name="tag" size={10} color={colors.accent} />
                  <Text style={[styles.badgeText, { color: colors.accent }]} numberOfLines={1}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.noteTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.noteSummary, { color: colors.textSecondary }]} numberOfLines={2}>
            {preview}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderTagChip = (value: string, label: string) => {
    const selected = activeTag === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setActiveTag(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            { color: selected ? colors.textOnPrimary : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('notes.title')}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <FontAwesome5 name="search" size={14} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={search}
            onChangeText={setSearch}
            placeholder={t('notes.searchPlaceholder')}
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

      {/* Tag filter chips */}
      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          {renderTagChip(ALL_TAGS, t('notes.allCategories'))}
          {tags.map((tag) => renderTagChip(tag, tag))}
        </ScrollView>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notes.length === 0 ? (
        <EmptyState
          icon="file-alt"
          title={t('notes.emptyTitle')}
          description={t('notes.emptyDesc')}
        />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon="search"
          title={t('notes.noResultsTitle')}
          description={t('notes.noResultsDesc')}
        />
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

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
    paddingBottom: 12,
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
  chipScroll: {
    maxHeight: 44,
    marginBottom: 12,
  },
  chipRow: {
    paddingHorizontal: theme.spacing.screenPadding,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: 100,
    gap: 16,
  },
  cardContainer: {
    marginBottom: 16,
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
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    maxWidth: 140,
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
    marginBottom: 8,
  },
  noteSummary: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
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
