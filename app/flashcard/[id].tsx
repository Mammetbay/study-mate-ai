import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';
import { getFlashcardsByNoteId, getNoteById, updateFlashcardReview } from '../../lib/db';
import { Flashcard, Note } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type CardResult = 'known' | 'missed' | null;

export default function FlashcardPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const db = useSQLiteContext();

  const [note, setNote] = useState<Note | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<CardResult[]>([]);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        if (id) {
          const noteData = await getNoteById(db, id);
          const flashcardData = await getFlashcardsByNoteId(db, id);
          if (isActive) {
            setNote(noteData);
            setCards(flashcardData);
            setResults(Array(flashcardData.length).fill(null));
          }
        }
      } catch (err) {
        if (isActive) console.error('Failed to load flashcards:', err);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [id, db]);

  const knownCount = useMemo(
    () => results.filter((result) => result === 'known').length,
    [results]
  );
  const missedCount = useMemo(
    () => results.filter((result) => result === 'missed').length,
    [results]
  );
  const remainingCount = Math.max(cards.length - knownCount - missedCount, 0);

  const markResult = async (result: 'known' | 'missed') => {
    if (cards.length === 0) return;

    const card = cards[currentIndex];
    const nextResults = [...results];
    nextResults[currentIndex] = result;
    setResults(nextResults);

    try {
      await updateFlashcardReview(db, card.id, new Date().toISOString());
    } catch (err) {
      console.error('Failed to update flashcard review:', err);
    }
  };

  const goToIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= cards.length) return;
    setCurrentIndex(nextIndex);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!note || cards.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {t('flashcards.noneFound')}
        </Text>
        <Button
          label={t('common.back')}
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  const currentResult = results[currentIndex];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('flashcards.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {note.title}
          </Text>
        </View>

        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      <View style={styles.segmentTrack}>
        {cards.map((_, index) => (
          <View
            key={cards[index].id}
            style={[
              styles.segment,
              {
                backgroundColor:
                  index <= currentIndex ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsFlipped((prev) => !prev)}>
          <Card style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.sideRow}>
                <View style={[styles.sideDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.sideLabel, { color: colors.primary }]}>
                  {isFlipped ? t('flashcards.back') : t('flashcards.front')}
                </Text>
              </View>
              <View style={styles.flipHint}>
                <FontAwesome5 name="sync-alt" size={12} color={colors.textSecondary} />
                <Text style={[styles.flipHintText, { color: colors.textSecondary }]}>
                  {t('flashcards.tapToFlip')}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={[styles.definitionLabel, { color: colors.textSecondary }]}>
                {isFlipped ? t('flashcards.answer') : t('flashcards.definition')}
              </Text>
              <Text style={[styles.cardText, { color: colors.textPrimary }]}>
                {isFlipped ? currentCard.back : currentCard.front}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        {!isFlipped && (
          <View style={[styles.hiddenBanner, { backgroundColor: colors.surface }]}>
            <FontAwesome5 name="eye-slash" size={14} color={colors.textSecondary} />
            <Text style={[styles.hiddenText, { color: colors.textSecondary }]}>
              {t('flashcards.answerHidden')}
            </Text>
          </View>
        )}

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.prevBtn, { backgroundColor: colors.surface }]}
            onPress={() => goToIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <FontAwesome5
              name="arrow-left"
              size={12}
              color={currentIndex === 0 ? colors.border : colors.textPrimary}
            />
            <Text
              style={[
                styles.prevLabel,
                { color: currentIndex === 0 ? colors.border : colors.textPrimary },
              ]}
            >
              {t('flashcards.previous')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedbackBtn,
              {
                borderColor: colors.error,
                backgroundColor:
                  currentResult === 'missed' ? `${colors.error}22` : 'transparent',
              },
            ]}
            onPress={() => markResult('missed')}
          >
            <FontAwesome5 name="thumbs-down" size={16} color={colors.error} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedbackBtn,
              {
                borderColor: colors.accent,
                backgroundColor:
                  currentResult === 'known' ? `${colors.accent}22` : 'transparent',
              },
            ]}
            onPress={() => markResult('known')}
          >
            <FontAwesome5 name="thumbs-up" size={16} color={colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (currentIndex + 1 < cards.length) {
                goToIndex(currentIndex + 1);
              } else {
                router.back();
              }
            }}
          >
            <Text style={[styles.nextLabel, { color: colors.textOnPrimary }]}>
              {currentIndex + 1 < cards.length ? t('common.next') : t('common.done')}
            </Text>
            <FontAwesome5 name="arrow-right" size={12} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{knownCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('flashcards.known')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{missedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('flashcards.missed')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>
              {remainingCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('flashcards.remaining')}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    marginTop: 2,
  },
  counter: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
  segmentTrack: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: theme.spacing.screenPadding,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenPadding,
    gap: 14,
  },
  card: {
    minHeight: 280,
    padding: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sideLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    letterSpacing: 1,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flipHintText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
  },
  cardBody: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  definitionLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  cardText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
  },
  hiddenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: theme.radius.button,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hiddenText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    fontStyle: 'italic',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.button,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  prevLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
  },
  feedbackBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.button,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: theme.radius.button,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  nextLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: theme.radius.card,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 22,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
  },
});
