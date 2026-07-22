import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { useAppContext, useThemeColors } from '../../lib/AppContext';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SettingsRow } from '../../components/ui/SettingsRow';
import { Button } from '../../components/ui/Button';
import { LANGUAGE_LABELS, LanguageCode, SUPPORTED_LANGUAGES } from '../../config/languages';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const {
    language,
    setLanguage,
    isDarkMode,
    setIsDarkMode,
    apiKey,
    setApiKey,
  } = useAppContext();

  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveKey = () => {
    setApiKey(apiKeyInput);
    Alert.alert('', t('settings.keySaved'));
  };

  const handleClearNotes = () => {
    Alert.alert(
      t('settings.clearConfirmTitle'),
      t('settings.clearConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            // Will be implemented when DB helpers are ready
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('settings.title')}</Text>

        {/* LANGUAGE */}
        <SectionHeader title={t('settings.language')} />
        <Card>
          <SettingsRow
            icon="globe"
            label={t('settings.appLanguage')}
            value={LANGUAGE_LABELS[language]}
            showChevron
          />
          <View style={styles.langButtons}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langButton,
                  {
                    backgroundColor: language === lang ? colors.primary : colors.surface,
                    borderColor: language === lang ? colors.primary : colors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setLanguage(lang)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    {
                      color: language === lang ? colors.textOnPrimary : colors.textPrimary,
                    },
                  ]}
                >
                  {LANGUAGE_LABELS[lang]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* APPEARANCE */}
        <SectionHeader title={t('settings.appearance')} />
        <Card>
          <SettingsRow
            icon="moon"
            label={t('settings.theme')}
            value={isDarkMode ? t('settings.dark') : t('settings.light')}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textOnPrimary}
              />
            }
          />
        </Card>

        {/* AI CONFIGURATION */}
        <SectionHeader title={t('settings.aiConfiguration')} />
        <Card>
          <View style={styles.apiKeySection}>
            <View style={styles.apiKeyHeader}>
              <FontAwesome5 name="key" size={16} color={colors.primary} />
              <Text style={[styles.apiKeyLabel, { color: colors.textPrimary }]}>
                {t('settings.apiKey')}
              </Text>
            </View>
            <View style={[styles.apiKeyInputWrap, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.apiKeyInput, { color: colors.textPrimary }]}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder={t('settings.apiKeyPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                <FontAwesome5
                  name={showApiKey ? 'eye' : 'eye-slash'}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.apiKeyHint, { color: colors.textSecondary }]}>
              {t('settings.apiKeyHint')}
            </Text>
            <Button
              label={t('settings.saveKey')}
              onPress={handleSaveKey}
              icon={<FontAwesome5 name="save" size={14} color={colors.textOnPrimary} />}
              style={styles.saveButton}
            />
          </View>
        </Card>

        {/* ABOUT */}
        <SectionHeader title={t('settings.about')} />
        <Card>
          <SettingsRow icon="info-circle" label={t('settings.version')} value="1.0.0" />
          <SettingsRow icon="file-alt" label={t('settings.privacyPolicy')} showChevron onPress={() => {}} />
          <SettingsRow icon="shield-alt" label={t('settings.termsOfService')} showChevron onPress={() => {}} />
          <SettingsRow icon="envelope" label={t('settings.contactSupport')} showChevron onPress={() => {}} />
        </Card>

        {/* Clear All Notes */}
        <View style={styles.clearSection}>
          <Button
            label={t('settings.clearAllNotes')}
            variant="danger"
            onPress={handleClearNotes}
            icon={<FontAwesome5 name="trash-alt" size={14} color={colors.error} />}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: 120,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 28,
    marginTop: 8,
  },
  langButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  langButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  langButtonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
  apiKeySection: {
    gap: 12,
  },
  apiKeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  apiKeyLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
  },
  apiKeyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  apiKeyInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
  },
  apiKeyHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  saveButton: {
    marginTop: 4,
  },
  clearSection: {
    marginTop: 28,
    marginBottom: 20,
  },
});
