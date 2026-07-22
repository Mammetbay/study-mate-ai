import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../lib/theme';
import { useAppContext, useThemeColors } from '../../lib/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  iconName: string;
  titleKey: string;
  descKey: string;
}

const SLIDES: SlideData[] = [
  {
    iconName: 'microphone-alt',
    titleKey: 'onboarding.slide1Title',
    descKey: 'onboarding.slide1Desc',
  },
  {
    iconName: 'magic',
    titleKey: 'onboarding.slide2Title',
    descKey: 'onboarding.slide2Desc',
  },
  {
    iconName: 'layer-group',
    titleKey: 'onboarding.slide3Title',
    descKey: 'onboarding.slide3Desc',
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const { setOnboardingCompleted } = useAppContext();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    setOnboardingCompleted(true);
    router.replace('/(tabs)/home' as any);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Icon container */}
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <FontAwesome5 name={item.iconName} size={40} color={colors.primary} />
        {/* Decorative waveform bars */}
        <View style={styles.waveContainer}>
          {[12, 20, 8, 24, 16, 10, 22, 14, 18].map((h, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: h,
                  backgroundColor: i % 2 === 0 ? colors.primary : colors.accent,
                  opacity: 0.6 + (i % 3) * 0.15,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Text */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t(item.titleKey)}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{t(item.descKey)}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('common.skip')}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, index) => String(index)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex
                  ? { backgroundColor: colors.primary, width: 24 }
                  : { backgroundColor: colors.textSecondary, opacity: 0.3 },
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, { color: colors.textOnPrimary }]}>
            {isLastSlide ? t('common.getStarted') : t('common.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: 12,
    height: 28,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
  },
});
