import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { theme } from '../../lib/theme';
import { AudioPlayerCard } from '../../components/study/AudioPlayerCard';
import { useAppContext, useThemeColors } from '../../lib/AppContext';
import {
  getFlashcardsByNoteId,
  getNoteById,
  getQuizQuestionsByNoteId,
  insertFlashcards,
  insertQuizQuestions,
  updateNoteSummary,
} from '../../lib/db';
import { generateFlashcards, generateQuiz, generateSummary } from '../../lib/ai/service';
import { Flashcard, Note, QuizQuestion } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type DetailTab = 'summary' | 'transcript';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { aiSettings, language } = useAppContext();
  const db = useSQLiteContext();

  const [note, setNote] = useState<Note | null>(null);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('summary');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        try {
          if (id) {
            const noteData = await getNoteById(db, id);
            const quizData = await getQuizQuestionsByNoteId(db, id);
            const flashcardData = await getFlashcardsByNoteId(db, id);
            if (isActive) {
              setNote(noteData);
              setQuizzes(quizData);
              setFlashcards(flashcardData);
            }
          }
        } catch (err) {
          if (isActive) console.error('Failed to load note detail:', err);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchData();

      return () => {
        isActive = false;
      };
    }, [id, db])
  );

  const providerName = aiSettings.providerId.charAt(0).toUpperCase() + aiSettings.providerId.slice(1);

  const requireApiKey = (): boolean => {
    if (!aiSettings.apiKeys[aiSettings.providerId]) {
      Alert.alert(
        t('common.apiKeyRequired'),
        t('common.apiKeyRequiredMessage', { provider: providerName })
      );
      return false;
    }
    return true;
  };

  const handleGenerateSummary = async () => {
    if (!note || !requireApiKey()) return;

    setGeneratingSummary(true);
    try {
      const summaryText = await generateSummary(note.transcript, aiSettings, language);
      await updateNoteSummary(db, note.id, summaryText);
      setNote((prev) => (prev ? { ...prev, summary: summaryText } : null));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('common.unknownError');
      Alert.alert(t('common.error'), message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!note || !requireApiKey()) return;

    setGeneratingQuiz(true);
    try {
      const questions = await generateQuiz(note.id, note.transcript, aiSettings, language);
      await insertQuizQuestions(db, questions);
      setQuizzes(questions);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('common.unknownError');
      Alert.alert(t('common.error'), message);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!note || !requireApiKey()) return;

    setGeneratingFlashcards(true);
    try {
      const cards = await generateFlashcards(note.id, note.transcript, aiSettings, language);
      await insertFlashcards(db, cards);
      setFlashcards(cards);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('common.unknownError');
      Alert.alert(t('common.error'), message);
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>{t('noteDetail.notFound')}</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasSummary = Boolean(note.summary && note.summary !== 'Pending...');
  const metaLabel = `${new Date(note.createdAt).toLocaleDateString()} · ${
    note.sourceType === 'audio' ? t('notes.lecture') : t('notes.photo')
  }`;

  const summaryLines = hasSummary
    ? note.summary
        .split('\n')
        .map((line) => line.replace(/^•\s*/, '').trim())
        .filter(Boolean)
    : [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{metaLabel}</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {note.title}
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'summary'
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface },
          ]}
          onPress={() => setActiveTab('summary')}
        >
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'summary' ? colors.textOnPrimary : colors.textSecondary,
              },
            ]}
          >
            {t('noteDetail.summary')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'transcript'
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface },
          ]}
          onPress={() => setActiveTab('transcript')}
        >
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'transcript' ? colors.textOnPrimary : colors.textSecondary,
              },
            ]}
          >
            {t('noteDetail.transcript')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Source media: original photo or audio playback */}
        {note.sourceType === 'image' && note.imageUri ? (
          <Image
            source={{ uri: note.imageUri }}
            style={styles.sourceImage}
            contentFit="cover"
            transition={150}
          />
        ) : note.sourceType === 'audio' && note.audioUri ? (
          <AudioPlayerCard uri={note.audioUri} />
        ) : null}

        {activeTab === 'summary' ? (
          <Card style={styles.contentCard}>
            <View style={styles.sectionHeaderRow}>
              <FontAwesome5 name="magic" size={14} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                {t('noteDetail.aiSummary')}
              </Text>
            </View>

            {hasSummary ? (
              <View style={styles.summaryBody}>
                {summaryLines.map((line, index) => (
                  <View key={`${index}-${line.slice(0, 12)}`} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.bodyText, { color: colors.textPrimary }]}>{line}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.actionBox}>
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                  {t('noteDetail.summaryEmpty')}
                </Text>
                <Button
                  label={t('noteDetail.generateSummary')}
                  onPress={handleGenerateSummary}
                  loading={generatingSummary}
                  disabled={generatingSummary}
                  variant="primary"
                />
              </View>
            )}
          </Card>
        ) : (
          <Card style={styles.contentCard}>
            <Text style={[styles.bodyText, { color: colors.textPrimary }]}>{note.transcript}</Text>
          </Card>
        )}

        <View style={styles.ctaGroup}>
          <Button
            label={
              quizzes.length > 0
                ? t('noteDetail.solveQuiz')
                : t('noteDetail.generateQuiz')
            }
            onPress={
              quizzes.length > 0
                ? () => router.push(`/quiz/${note.id}` as any)
                : handleGenerateQuiz
            }
            loading={generatingQuiz}
            disabled={generatingQuiz}
            variant="primary"
            icon={
              <FontAwesome5
                name={quizzes.length > 0 ? 'play' : 'question-circle'}
                size={14}
                color={colors.textOnPrimary}
              />
            }
          />
          <Button
            label={
              flashcards.length > 0
                ? t('noteDetail.openFlashcards')
                : t('noteDetail.generateFlashcards')
            }
            onPress={
              flashcards.length > 0
                ? () => router.push(`/flashcard/${note.id}` as any)
                : handleGenerateFlashcards
            }
            loading={generatingFlashcards}
            disabled={generatingFlashcards}
            variant="secondary"
            icon={
              <FontAwesome5
                name="clone"
                size={14}
                color={colors.primary}
              />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: 12,
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingTop: 2,
  },
  metaText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 20,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screenPadding,
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: theme.radius.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: 40,
    gap: 16,
  },
  sourceImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.radius.card,
  },
  contentCard: {
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryBody: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  bodyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    flex: 1,
  },
  placeholderText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    marginBottom: 12,
  },
  actionBox: {
    marginTop: 4,
  },
  ctaGroup: {
    gap: 12,
    marginTop: 8,
  },
});
