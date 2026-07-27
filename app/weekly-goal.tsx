import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../lib/theme';
import { useAppContext, useThemeColors } from '../lib/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const MIN_GOAL = 1;
const MAX_GOAL = 200;
const STEP = 5;

export default function WeeklyGoalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { weeklyGoal, setWeeklyGoal } = useAppContext();

  const [value, setValue] = useState<number>(weeklyGoal);

  const clamp = (n: number) => Math.min(MAX_GOAL, Math.max(MIN_GOAL, n));
  const decrement = () => setValue((v) => clamp(v - STEP));
  const increment = () => setValue((v) => clamp(v + STEP));

  const handleSave = () => {
    setWeeklyGoal(clamp(value));
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('weeklyGoal.title')}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('weeklyGoal.subtitle')}
        </Text>

        <Card style={styles.stepperCard}>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={decrement}
              disabled={value <= MIN_GOAL}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="minus" size={18} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.valueBox}>
              <Text style={[styles.valueNumber, { color: colors.textPrimary }]}>{value}</Text>
              <Text style={[styles.valueUnit, { color: colors.textSecondary }]}>
                {t('weeklyGoal.perWeek')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.stepButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={increment}
              disabled={value >= MAX_GOAL}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <Button label={t('weeklyGoal.save')} onPress={handleSave} variant="primary" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 22,
  },
  body: {
    padding: theme.spacing.screenPadding,
    gap: 24,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  stepperCard: {
    paddingVertical: 28,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueBox: {
    alignItems: 'center',
  },
  valueNumber: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 48,
  },
  valueUnit: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    marginTop: 2,
  },
});
