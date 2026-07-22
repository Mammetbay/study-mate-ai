import { Redirect } from 'expo-router';
import { useAppContext } from '../lib/AppContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export default function Index() {
  const { onboardingCompleted, isReady } = useAppContext();

  // Wait until settings loaded from AsyncStorage
  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.dark.primary} />
      </View>
    );
  }

  // Route based on onboarding completion
  if (!onboardingCompleted) {
    return <Redirect href={"/(onboarding)" as any} />;
  }

  return <Redirect href={"/(tabs)/home" as any} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
