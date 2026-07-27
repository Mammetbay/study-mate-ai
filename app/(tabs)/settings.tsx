import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SettingsRow } from '../../components/ui/SettingsRow';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../config/languages';
import { PROVIDERS } from '../../config/providers';
import { ABOUT_LINKS } from '../../config/about';
import { useModelCatalog } from '../../lib/ai/useModelCatalog';
import { clearAllNotes } from '../../lib/db';
import { useSQLiteContext } from 'expo-sqlite';
import { useAppContext, useThemeColors } from '../../lib/AppContext';
import { theme } from '../../lib/theme';
import { AICapability, AIModel, AISettings, ProviderId } from '../../types/ai';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const db = useSQLiteContext();
  const {
    language,
    setLanguage,
    isDarkMode,
    setIsDarkMode,
    aiSettings,
    setAiSettings,
  } = useAppContext();

  const currentApiKey = aiSettings.apiKeys[aiSettings.providerId] ?? '';
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [activeModelCapability, setActiveModelCapability] = useState<AICapability>('chat');

  // Opens an external URL (or mailto:), surfacing a friendly error if the
  // device has no app able to handle it.
  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('common.error'), t('common.unknownError'));
    }
  };

  const currentProvider = useMemo(
    () => PROVIDERS.find((p) => p.id === aiSettings.providerId)!,
    [aiSettings.providerId]
  );

  // Live model catalog, fetched from the provider using the *saved* API key.
  const { catalog, loading, error, needsKey, refresh } = useModelCatalog(
    aiSettings.providerId,
    currentApiKey
  );

  const sttModels = catalog.stt;
  const visionModels = catalog.vision;
  const chatModels = catalog.chat;

  // Once a catalog is loaded, keep selected models valid: drop selections that
  // no longer exist and default to the first available model per capability.
  useEffect(() => {
    const capabilities: AICapability[] = ['stt', 'vision', 'chat'];
    let changed = false;
    const next = { ...aiSettings.selectedModels };

    for (const cap of capabilities) {
      const models = catalog[cap];
      const current = next[cap];
      if (models.length === 0) {
        if (current !== null) {
          next[cap] = null;
          changed = true;
        }
      } else if (!models.some((m) => m.id === current)) {
        next[cap] = models[0].id;
        changed = true;
      }
    }

    if (changed) {
      setAiSettings({ ...aiSettings, selectedModels: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  const handleProviderChange = (id: ProviderId) => {
    const newSettings: AISettings = {
      ...aiSettings,
      providerId: id,
    };
    setAiSettings(newSettings);
    // Update local API key input to show the new provider's key
    setApiKeyInput(newSettings.apiKeys[id] ?? '');
  };

  const handleSaveKey = () => {
    setAiSettings({
      ...aiSettings,
      apiKeys: { ...aiSettings.apiKeys, [aiSettings.providerId]: apiKeyInput },
    });
    Alert.alert('', t('settings.keySaved'));
  };

  const openModelPicker = (capability: AICapability) => {
    setActiveModelCapability(capability);
    setModelPickerVisible(true);
  };

  const handleModelSelect = (model: AIModel) => {
    setAiSettings({
      ...aiSettings,
      selectedModels: { ...aiSettings.selectedModels, [activeModelCapability]: model.id },
    });
    setModelPickerVisible(false);
  };

  const getActiveModels = (): AIModel[] => {
    return catalog[activeModelCapability];
  };

  const getModelLabel = (capability: AICapability): string => {
    const modelId = aiSettings.selectedModels[capability];
    if (!modelId) {
      if (loading) return t('settings.loadingModels');
      if (needsKey) return t('settings.keyRequiredForModels');
      return t('settings.modelNotAvailable', { provider: currentProvider.name });
    }
    return catalog[capability].find((m) => m.id === modelId)?.label ?? modelId;
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
          onPress: async () => {
            try {
              await clearAllNotes(db);
              Alert.alert('', t('settings.clearSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('common.unknownError'));
            }
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

        {/* Provider Selector */}
        <Card>
          <View style={styles.apiKeyHeader}>
            <FontAwesome5 name="robot" size={16} color={colors.primary} />
            <Text style={[styles.apiKeyLabel, { color: colors.textPrimary }]}>
              {t('settings.provider')}
            </Text>
          </View>
          <View style={styles.providerButtons}>
            {PROVIDERS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.providerButton,
                  {
                    backgroundColor: aiSettings.providerId === p.id ? colors.primary : colors.surface,
                    borderColor: aiSettings.providerId === p.id ? colors.primary : colors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleProviderChange(p.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.providerButtonText,
                    {
                      color: aiSettings.providerId === p.id ? colors.textOnPrimary : colors.textPrimary,
                    },
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        

        {/* API Key */}
        
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
                placeholder={t('settings.apiKeyPlaceholder', { provider: currentProvider.name })}
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
        

        {/* Model Selectors */}
          <View style={styles.modelHeaderRow}>
            <View style={styles.apiKeyHeader}>
              <FontAwesome5 name="cogs" size={16} color={colors.primary} />
              <Text style={[styles.apiKeyLabel, { color: colors.textPrimary }]}>
                {t('settings.selectModel')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refresh}
              disabled={loading || needsKey}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <FontAwesome5
                  name="sync-alt"
                  size={14}
                  color={needsKey ? colors.textSecondary : colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Status line: needs key / error */}
          {needsKey && (
            <Text style={[styles.modelStatus, { color: colors.textSecondary }]}>
              {t('settings.keyRequiredForModels')}
            </Text>
          )}
          {!needsKey && error && (
            <Text style={[styles.modelStatus, { color: colors.error }]}>
              {t('settings.modelsLoadError')}
            </Text>
          )}

          {/* STT Model */}
          <TouchableOpacity
            style={[styles.modelRow, { borderColor: colors.border }]}
            onPress={() => sttModels.length > 0 && openModelPicker('stt')}
            disabled={sttModels.length === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.modelRowLabel, { color: colors.textSecondary }]}>
              {t('settings.sttModel')}
            </Text>
            <Text
              style={[
                styles.modelRowValue,
                { color: sttModels.length > 0 ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              {getModelLabel('stt')}
            </Text>
            {sttModels.length > 0 && (
              <FontAwesome5 name="chevron-down" size={12} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {/* Vision Model */}
          <TouchableOpacity
            style={[styles.modelRow, { borderColor: colors.border }]}
            onPress={() => visionModels.length > 0 && openModelPicker('vision')}
            disabled={visionModels.length === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.modelRowLabel, { color: colors.textSecondary }]}>
              {t('settings.visionModel')}
            </Text>
            <Text style={[styles.modelRowValue, { color: colors.textPrimary }]}>
              {getModelLabel('vision')}
            </Text>
            {visionModels.length > 0 && (
              <FontAwesome5 name="chevron-down" size={12} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {/* Chat Model */}
          <TouchableOpacity
            style={[styles.modelRow, { borderColor: colors.border }]}
            onPress={() => chatModels.length > 0 && openModelPicker('chat')}
            disabled={chatModels.length === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.modelRowLabel, { color: colors.textSecondary }]}>
              {t('settings.chatModel')}
            </Text>
            <Text style={[styles.modelRowValue, { color: colors.textPrimary }]}>
              {getModelLabel('chat')}
            </Text>
            {chatModels.length > 0 && (
              <FontAwesome5 name="chevron-down" size={12} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </Card>

        {/* Model Picker Modal */}
        <Modal
          visible={modelPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModelPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModelPickerVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('settings.selectModel')}
              </Text>
              <FlatList
                data={getActiveModels()}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      {
                        backgroundColor:
                          aiSettings.selectedModels[activeModelCapability] === item.id
                            ? colors.primary
                            : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleModelSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        {
                          color:
                            aiSettings.selectedModels[activeModelCapability] === item.id
                              ? colors.textOnPrimary
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={[styles.modelStatus, { color: colors.textSecondary, textAlign: 'center' }]}>
                    {t('settings.noModelsAvailable')}
                  </Text>
                }
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ABOUT */}
        <SectionHeader title={t('settings.about')} />
        <Card>
          <SettingsRow icon="info-circle" label={t('settings.version')} value="1.0.0" />
          <SettingsRow
            icon="file-alt"
            label={t('settings.privacyPolicy')}
            showChevron
            onPress={() => openLink(ABOUT_LINKS.privacyPolicyUrl)}
          />
          <SettingsRow
            icon="shield-alt"
            label={t('settings.termsOfService')}
            showChevron
            onPress={() => openLink(ABOUT_LINKS.termsOfServiceUrl)}
          />
          <SettingsRow
            icon="envelope"
            label={t('settings.contactSupport')}
            showChevron
            onPress={() => openLink(`mailto:${ABOUT_LINKS.supportEmail}`)}
          />
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
    marginBottom: 24,
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
    lineHeight: 14,
  },
  saveButton: {
    marginTop: 4,
  },
  providerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 22
  },
  providerButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  providerButtonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refreshButton: {
    padding: 6,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelStatus: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    marginTop: 6,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  modelRowLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    width: 90,
  },
  modelRowValue: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.screenPadding,
    maxHeight: '50%',
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.button,
    marginBottom: 8,
    borderWidth: 1,
  },
  modalItemText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
  },
  clearSection: {
    marginTop: 28,
    marginBottom: 20,
  },
});
