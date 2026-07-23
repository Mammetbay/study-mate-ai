import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { getNotes } from '../../lib/db';
import { Note } from '../../types';

export default function NotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchNotes = async () => {
        try {
          const data = await getNotes();
          if (isActive) {
            setNotes(data);
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
    }, [])
  );

  const renderNoteCard = ({ item }: { item: Note }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/note/${item.id}` as any)}
      style={styles.cardContainer}
    >
      <Card style={styles.cardContent}>
        <View style={styles.cardHeader}>
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
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.noteTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.noteSummary, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.transcript}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('notes.title')}</Text>
      </View>

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
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
