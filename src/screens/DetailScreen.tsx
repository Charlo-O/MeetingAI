import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  TextInput as RNTextInput,
  Platform,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  Appbar,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
  IconButton,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { SimpleMarkdown } from '../components';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { useMeetingStore, useSettingsStore } from '../store';
import { audioRecorder, processMeeting, textToSpeech } from '../services';
import { formatDate, formatDuration, skeuColors, skeuStyles } from '../utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const DetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const theme = useTheme();
  const { meetingId } = route.params;
  const { getMeeting, updateMeeting } = useMeetingStore();
  const { settings } = useSettingsStore();

  const meeting = getMeeting(meetingId);

  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  useEffect(() => {
    if (meeting) {
      setEditedTranscript(meeting.transcript);
    }
  }, [meeting?.transcript]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!meeting) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="详情" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text>会议记录不存在</Text>
        </View>
      </View>
    );
  }

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const togglePlayback = async () => {
    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: meeting.audioUri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPlaybackPosition(status.positionMillis);
              setPlaybackDuration(status.durationMillis || 0);
              if (status.didJustFinish) {
                setIsPlaying(false);
              }
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error: any) {
      showSnackbar('播放失败: ' + error.message);
    }
  };

  const handleReprocess = async () => {
    if (!meeting.audioUri) {
      showSnackbar('录音文件不存在');
      return;
    }

    setIsProcessing(true);

    try {
      if (isEditing && editedTranscript !== meeting.transcript) {
        updateMeeting(meetingId, {
          transcript: editedTranscript,
          status: 'summarizing',
        });

        const { summarizeText } = await import('../services/aiService');
        const summary = await summarizeText(editedTranscript, settings);

        updateMeeting(meetingId, {
          summary,
          status: 'done',
        });
      } else {
        updateMeeting(meetingId, { status: 'transcribing' });

        const result = await processMeeting(meeting.audioUri, settings, (status) => {
          updateMeeting(meetingId, { status });
        });

        updateMeeting(meetingId, {
          transcript: result.transcript,
          summary: result.summary,
          status: 'done',
        });

        setEditedTranscript(result.transcript);
      }

      setIsEditing(false);
      showSnackbar('处理完成');
    } catch (error: any) {
      updateMeeting(meetingId, {
        status: 'error',
        errorMessage: error.message,
      });
      showSnackbar('处理失败: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTTS = async () => {
    if (!meeting.summary || !settings.ttsApiKey) {
      showSnackbar('请先配置 TTS API Key');
      return;
    }

    setIsTTSPlaying(true);

    try {
      // @ts-ignore - expo-file-system types issue
      const ttsPath = `${FileSystem.documentDirectory || ''}tts_${meetingId}.mp3`;
      await textToSpeech(meeting.summary, settings, ttsPath);

      const { sound: ttsSound } = await Audio.Sound.createAsync(
        { uri: ttsPath },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsTTSPlaying(false);
          }
        }
      );

      ttsSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          ttsSound.unloadAsync();
          setIsTTSPlaying(false);
        }
      });
    } catch (error: any) {
      setIsTTSPlaying(false);
      showSnackbar('TTS 失败: ' + error.message);
    }
  };

  const handleShare = async () => {
    try {
      const content = `# ${meeting.title}\n\n${meeting.summary}\n\n---\n\n## 原文\n\n${meeting.transcript}`;
      await Share.share({
        message: content,
        title: meeting.title,
      });
    } catch (error: any) {
      showSnackbar('分享失败');
    }
  };

  const handleCopy = async () => {
    try {
      const content = activeTab === 'summary' ? meeting.summary : meeting.transcript;
      await Clipboard.setStringAsync(content);
      showSnackbar('已复制到剪贴板');
    } catch (error) {
      showSnackbar('复制失败');
    }
  };

  const renderContent = () => {
    if (meeting.status === 'transcribing' || meeting.status === 'summarizing') {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={skeuColors.primary} />
          <Text style={styles.processingText}>
            {meeting.status === 'transcribing' ? '正在转录语音...' : '正在生成总结...'}
          </Text>
        </View>
      );
    }

    if (meeting.status === 'error') {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>处理失败</Text>
          <Text style={styles.errorMessage}>{meeting.errorMessage}</Text>
          <TouchableOpacity style={styles.skeuButton} onPress={handleReprocess}>
            <Text style={styles.skeuButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (meeting.status === 'recorded') {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.pendingText}>待处理</Text>
          <Text style={styles.pendingHint}>点击下方按钮开始处理录音</Text>
          <TouchableOpacity style={styles.skeuPrimaryButton} onPress={handleReprocess}>
            <Text style={styles.skeuPrimaryButtonText}>开始处理</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'summary') {
      return (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
          <View style={styles.contentCard}>
            <SimpleMarkdown>
              {meeting.summary || '暂无总结'}
            </SimpleMarkdown>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.contentCard}>
          {isEditing ? (
            <RNTextInput
              style={styles.transcriptInput}
              value={editedTranscript}
              onChangeText={setEditedTranscript}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.transcriptText}>
              {meeting.transcript || '暂无原文'}
            </Text>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={meeting.title} subtitle={formatDate(meeting.createdAt)} />
        <Appbar.Action icon="share-variant" onPress={handleShare} />
      </Appbar.Header>

      {/* Tab 切换 - 轻拟物风格 */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'summary' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('summary')}
          >
            <MaterialCommunityIcons
              name="text-box-outline"
              size={18}
              color={activeTab === 'summary' ? skeuColors.primary : skeuColors.textSecondary}
            />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'summary' && styles.tabButtonTextActive,
            ]}>
              总结
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'transcript' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('transcript')}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={18}
              color={activeTab === 'transcript' ? skeuColors.primary : skeuColors.textSecondary}
            />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'transcript' && styles.tabButtonTextActive,
            ]}>
              原文
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容区域 */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* 底部操作栏 - 轻拟物凸起效果 */}
      <View style={styles.bottomBar}>
        {/* 播放控制 */}
        <View style={styles.playbackRow}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayback}
            disabled={!meeting.audioUri}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color={meeting.audioUri ? skeuColors.primary : skeuColors.textMuted}
            />
          </TouchableOpacity>

          <Text style={styles.playbackTime}>
            {formatDuration(Math.floor(playbackPosition / 1000))} / {formatDuration(meeting.duration)}
          </Text>

          {activeTab === 'summary' && settings.ttsApiKey && (
            <TouchableOpacity
              style={styles.ttsButton}
              onPress={handleTTS}
              disabled={!meeting.summary || isTTSPlaying}
            >
              <MaterialCommunityIcons
                name={isTTSPlaying ? 'stop' : 'volume-high'}
                size={20}
                color={meeting.summary && !isTTSPlaying ? skeuColors.primary : skeuColors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* 操作按钮 */}
        <View style={styles.actionRow}>
          {activeTab === 'transcript' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <MaterialCommunityIcons
                name={isEditing ? 'check' : 'pencil'}
                size={18}
                color={skeuColors.textPrimary}
              />
              <Text style={styles.actionButtonText}>
                {isEditing ? '完成编辑' : '编辑原文'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopy}
          >
            <MaterialCommunityIcons
              name="content-copy"
              size={18}
              color={skeuColors.textPrimary}
            />
            <Text style={styles.actionButtonText}>复制</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={handleReprocess}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="refresh"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryActionButtonText}>
                  {isEditing ? '重新生成' : '重新处理'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: skeuColors.background,
  },
  appbar: {
    backgroundColor: skeuColors.background,
    elevation: 0,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(163, 177, 198, 0.1)',
      },
    }),
  },
  tabContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: skeuColors.backgroundDark,
    borderRadius: 16,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 1,
      },
      android: {
        elevation: 0, // inset not well supported, use color diff
      }
    }),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: skeuColors.background,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabButtonText: {
    fontSize: 14,
    color: skeuColors.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: skeuColors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  contentCard: {
    backgroundColor: skeuColors.background, // Match page background for flat/raised look
    borderRadius: 24,
    padding: 24,
    minHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: skeuColors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: skeuColors.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: skeuColors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  pendingText: {
    fontSize: 18,
    color: skeuColors.warning,
    marginBottom: 8,
  },
  pendingHint: {
    fontSize: 14,
    color: skeuColors.textSecondary,
    marginBottom: 16,
  },
  skeuButton: {
    ...skeuStyles.neumorphicButton,
    marginTop: 8,
  },
  skeuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: skeuColors.textPrimary,
  },
  skeuPrimaryButton: {
    ...skeuStyles.primaryButton,
    marginTop: 8,
  },
  skeuPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 28, // better readability
    color: skeuColors.textPrimary,
  },
  transcriptInput: {
    fontSize: 16,
    lineHeight: 28,
    color: skeuColors.textPrimary,
    minHeight: 200,
    padding: 0,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    backgroundColor: skeuColors.background,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: skeuColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...skeuStyles.neumorphicButton,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  ttsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: skeuColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    marginLeft: 16,
  },
  playbackTime: {
    flex: 1,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    color: skeuColors.textPrimary,
    marginLeft: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(163, 177, 198, 0.2)',
    marginHorizontal: 24,
  },
  actionRow: {
    flexDirection: 'row',
    padding: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: skeuColors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
    ...skeuStyles.neumorphicButton,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: skeuColors.textPrimary,
  },
  primaryActionButton: {
    backgroundColor: skeuColors.primary,
    ...skeuStyles.primaryButton,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  primaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
