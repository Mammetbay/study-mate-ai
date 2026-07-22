import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../lib/AppContext';
import { theme } from '../../lib/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 72,
          paddingBottom: 28,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: t('tabs.notes'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="file-alt" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: t('tabs.quiz'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="brain" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="cog" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
