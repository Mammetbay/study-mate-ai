import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { getNoteById, getQuizQuestionsByNoteId } from '../../lib/db';
import { Note, QuizQuestion } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export default function QuizPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const db = useSQLiteContext();

  const [note, setNote] = useState<Note | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        if (id) {
          const noteData = await getNoteById(db, id);
          const quizData = await getQuizQuestionsByNoteId(db, id);
          if (isActive) {
            setNote(noteData);
            setQuestions(quizData);
          }
        }
      } catch (err) {
        if (isActive) console.error('Failed to load quiz:', err);
      } finally {
        if (isActive) setLoading(false);
      }
    };
    loadData();

    return () => {
      isActive = false;
    };
  }, [id, db]);

  const handleOptionPress = (optionIndex: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(optionIndex);

    const currentQuestion = questions[currentIndex];
    if (optionIndex === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsCompleted(false);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!note || questions.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {t('quiz.noQuizFound')}
        </Text>
        <Button
          label={t('common.back')}
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  if (isCompleted) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.completedContent}>
          <Card style={styles.scoreCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
              <FontAwesome5
                name={percentage >= 70 ? 'trophy' : 'medal'}
                size={40}
                color={percentage >= 70 ? colors.primary : colors.accent}
              />
            </View>

            <Text style={[styles.scoreTitle, { color: colors.textPrimary }]}>
              {t('quiz.scoreTitle')}
            </Text>

            <Text style={[styles.scorePercent, { color: colors.primary }]}>
              {t('quiz.yourScore', { score: percentage })}
            </Text>

            <Text style={[styles.scoreSub, { color: colors.textSecondary }]}>
              {t('quiz.correctAnswers', { correct: score, total: questions.length })}
            </Text>

            <View style={styles.buttonGroup}>
              <Button
                label={t('quiz.retry')}
                onPress={handleRestart}
                variant="primary"
                style={styles.fullBtn}
              />
              <Button
                label={t('quiz.backToNotes')}
                onPress={() => router.back()}
                variant="secondary"
                style={styles.fullBtn}
              />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <FontAwesome5 name="times" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressHeader}>
        <Text style={[styles.questionCounter, { color: colors.textSecondary }]}>
          {t('quiz.questionOf', { current: currentIndex + 1, total: questions.length })}
        </Text>
        <Text style={[styles.percentText, { color: colors.accent }]}>{progressPercent}%</Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.accent, width: `${progressPercent}%` },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.questionCard}>
          <Text style={[styles.noteLabel, { color: colors.primary }]} numberOfLines={1}>
            {note.title.toUpperCase()}
          </Text>
          <Text style={[styles.questionText, { color: colors.textPrimary }]}>
            {currentQuestion.question}
          </Text>
        </Card>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, idx) => {
            const letter = OPTION_LETTERS[idx] ?? String(idx + 1);
            const isCorrect = idx === currentQuestion.correctIndex;
            const isSelected = idx === selectedOption;
            const answered = selectedOption !== null;

            let borderColor = colors.border;
            let letterColor = colors.textSecondary;
            let textColor = colors.textPrimary;
            let iconName: 'check' | 'times' | null = null;
            let iconColor = colors.accent;

            if (answered) {
              if (isCorrect) {
                borderColor = colors.accent;
                letterColor = colors.accent;
                textColor = colors.accent;
                iconName = 'check';
                iconColor = colors.accent;
              } else if (isSelected) {
                borderColor = colors.error;
                letterColor = colors.error;
                textColor = colors.error;
                iconName = 'times';
                iconColor = colors.error;
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.surface, borderColor },
                ]}
                onPress={() => handleOptionPress(idx)}
                activeOpacity={0.8}
                disabled={answered}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.letterBadge,
                      { borderColor: letterColor },
                    ]}
                  >
                    <Text style={[styles.letterText, { color: letterColor }]}>{letter}</Text>
                  </View>
                  <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                </View>
                {iconName && <FontAwesome5 name={iconName} size={16} color={iconColor} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedOption !== null && (
        <View style={styles.footer}>
          <Button
            label={t('quiz.nextQuestion')}
            onPress={handleNext}
            variant="primary"
            style={styles.fullBtn}
            icon={<FontAwesome5 name="arrow-right" size={14} color={colors.textOnPrimary} />}
          />
        </View>
      )}
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
  topBar: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    marginBottom: 8,
  },
  questionCounter: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
  },
  percentText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: 24,
    gap: 16,
  },
  questionCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  noteLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  questionText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: theme.radius.button,
    borderWidth: 1.5,
    minHeight: 56,
    gap: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
  },
  optionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    flex: 1,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: 16,
    paddingTop: 8,
  },
  completedContent: {
    padding: theme.spacing.screenPadding,
    justifyContent: 'center',
    flexGrow: 1,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 24,
    marginBottom: 8,
  },
  scorePercent: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 36,
    marginBottom: 8,
  },
  scoreSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    marginBottom: 28,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  fullBtn: {
    width: '100%',
  },
});
