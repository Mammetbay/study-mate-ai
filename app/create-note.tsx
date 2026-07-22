import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { theme } from '../lib/theme';
import { useThemeColors } from '../lib/AppContext';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export default function CreateNoteScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [noteTitle, setNoteTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordToggle = async () => {
    // Audio recording will be implemented in Phase 2-3
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      // OCR will be implemented in Phase 4
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      // OCR will be implemented in Phase 4
    }
  };

  const handleFiles = () => {
    // Document picker will be added later if needed
    Alert.alert('Coming Soon', 'File upload will be available in a future update.');
  };

  // Waveform bars (static decorative)
  const waveBars = [6, 14, 8, 18, 10, 22, 12, 16, 6, 20, 8, 14];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('createNote.title')}
          </Text>
        </View>

        {/* Note Title */}
        <Input
          label={t('createNote.noteTitle')}
          placeholder={t('createNote.noteTitlePlaceholder')}
          value={noteTitle}
          onChangeText={setNoteTitle}
        />

        {/* Choose input method */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('createNote.chooseInput')}
        </Text>

        {/* Record Audio Section */}
        <Card style={styles.recordCard}>
          {/* Mic button */}
          <TouchableOpacity
            style={[styles.micButton, { borderColor: isRecording ? colors.error : colors.primary }]}
            onPress={handleRecordToggle}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.micInner,
                { backgroundColor: isRecording ? colors.error : colors.primary },
              ]}
            >
              <FontAwesome5
                name={isRecording ? 'stop' : 'microphone'}
                size={28}
                color={colors.textOnPrimary}
              />
            </View>
          </TouchableOpacity>

          {/* Waveform */}
          <View style={styles.waveform}>
            {waveBars.map((height, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height,
                    backgroundColor: isRecording ? colors.error : colors.primary,
                    opacity: isRecording ? 0.8 : 0.5,
                  },
                ]}
              />
            ))}
          </View>

          {/* Label */}
          <Text style={[styles.recordLabel, { color: colors.textPrimary }]}>
            {isRecording ? t('createNote.recording') : t('createNote.recordAudio')}
          </Text>
          <Text style={[styles.recordHint, { color: colors.textSecondary }]}>
            {t('createNote.recordAudioDesc')}
          </Text>

          {/* Timer */}
          <View style={styles.timerRow}>
            <FontAwesome5 name="clock" size={14} color={colors.textSecondary} />
            <Text style={[styles.timerText, { color: colors.textSecondary }]}>00:00</Text>
          </View>
        </Card>

        {/* Divider "or" */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            {t('common.or')}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Photo / Upload Section */}
        <Card style={styles.photoCard}>
          <Text style={[styles.photoTitle, { color: colors.textPrimary }]}>
            {t('createNote.photoUpload')}
          </Text>
          <Text style={[styles.photoHint, { color: colors.textSecondary }]}>
            {t('createNote.photoUploadDesc')}
          </Text>

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleCamera}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="camera" size={22} color={colors.primary} />
              <Text style={[styles.photoBtnLabel, { color: colors.textPrimary }]}>
                {t('createNote.camera')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleGallery}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="images" size={22} color={colors.primary} />
              <Text style={[styles.photoBtnLabel, { color: colors.textPrimary }]}>
                {t('createNote.gallery')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleFiles}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="file-upload" size={22} color={colors.primary} />
              <Text style={[styles.photoBtnLabel, { color: colors.textPrimary }]}>
                {t('createNote.files')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
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
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 15,
    marginTop: 24,
    marginBottom: 12,
  },
  recordCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
    height: 24,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  recordLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    marginBottom: 4,
  },
  recordHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
  },
  photoCard: {
    paddingVertical: 20,
  },
  photoTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    marginBottom: 4,
  },
  photoHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    marginBottom: 16,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: theme.radius.button,
    borderWidth: 1,
    gap: 8,
  },
  photoBtnLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
  },
});
