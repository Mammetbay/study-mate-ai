import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { theme } from '../../lib/theme';
import { useThemeColors } from '../../lib/AppContext';
import { Card } from '../ui/Card';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Simple play/pause + progress control for a recorded note's audio. */
export function AudioPlayerCard({ uri }: { uri: string }) {
  const colors = useThemeColors();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const duration = status.duration || 0;
  const currentTime = Math.min(status.currentTime || 0, duration);
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      // Restart from the beginning once playback has finished.
      if (status.didJustFinish || currentTime >= duration) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: colors.primary }]}
        onPress={togglePlay}
        activeOpacity={0.8}
        disabled={!status.isLoaded}
      >
        <FontAwesome5
          name={status.playing ? 'pause' : 'play'}
          size={16}
          color={colors.textOnPrimary}
          style={status.playing ? undefined : styles.playIconOffset}
        />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progress}%` }]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTime(currentTime)}
          </Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOffset: {
    marginLeft: 2,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
  },
});
