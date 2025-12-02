import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  TextInput as RNTextInput,
} from 'react-native';
import {
  Appbar,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
  IconButton,
  SegmentedButtons,
  Card,
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
import { formatDate, formatDuration } from '../utils';

export const DetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const theme = useTheme();
  const { meetingId } = route.params;
  const { getMeeting, updateMeeting } = useMeetingStore();
  const { settings } = useSettingsStore();
  
  const meeting = getMeeting(meetingId);
  
  const [activeTab, setActiveTab] = useState('summary');
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
      // 清理音频
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  if (!meeting) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
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
  
  // 播放原始录音
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
  
  // 重新处理
  const handleReprocess = async () => {
    if (!meeting.audioUri) {
      showSnackbar('录音文件不存在');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 如果编辑了原文，使用编辑后的原文重新生成总结
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
        // 重新转录和总结
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
  
  // TTS 朗读总结
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
      
      // 播放完成后清理
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
  
  // 分享
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
  
  // 复制
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
          <Button mode="contained" onPress={handleReprocess} style={styles.retryButton}>
            重试
          </Button>
        </View>
      );
    }
    
    if (meeting.status === 'recorded') {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.pendingText}>待处理</Text>
          <Text style={styles.pendingHint}>点击下方按钮开始处理录音</Text>
          <Button mode="contained" onPress={handleReprocess} style={styles.processButton}>
            开始处理
          </Button>
        </View>
      );
    }
    
    if (activeTab === 'summary') {
      return (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
          <SimpleMarkdown>
            {meeting.summary || '暂无总结'}
          </SimpleMarkdown>
        </ScrollView>
      );
    }
    
    return (
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
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
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={meeting.title} subtitle={formatDate(meeting.createdAt)} />
        <Appbar.Action icon="share-variant" onPress={handleShare} />
      </Appbar.Header>
      
      {/* Tab 切换 */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'summary', label: '总结', icon: 'text-box-outline' },
            { value: 'transcript', label: '原文', icon: 'file-document-outline' },
          ]}
        />
      </View>
      
      {/* 内容区域 */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      
      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        {/* 播放控制 */}
        <View style={styles.playbackRow}>
          <IconButton
            icon={isPlaying ? 'pause' : 'play'}
            size={28}
            onPress={togglePlayback}
            disabled={!meeting.audioUri}
          />
          <Text style={styles.playbackTime}>
            {formatDuration(Math.floor(playbackPosition / 1000))} / {formatDuration(meeting.duration)}
          </Text>
          
          {activeTab === 'summary' && settings.ttsApiKey && (
            <IconButton
              icon={isTTSPlaying ? 'stop' : 'volume-high'}
              size={24}
              onPress={handleTTS}
              disabled={!meeting.summary || isTTSPlaying}
            />
          )}
        </View>
        
        <Divider />
        
        {/* 操作按钮 */}
        <View style={styles.actionRow}>
          {activeTab === 'transcript' && (
            <Button
              mode="outlined"
              onPress={() => setIsEditing(!isEditing)}
              icon={isEditing ? 'check' : 'pencil'}
              style={styles.actionButton}
            >
              {isEditing ? '完成编辑' : '编辑原文'}
            </Button>
          )}
          
          <Button
            mode="outlined"
            onPress={handleCopy}
            icon="content-copy"
            style={styles.actionButton}
          >
            复制
          </Button>
          
          <Button
            mode="contained"
            onPress={handleReprocess}
            icon="refresh"
            style={styles.actionButton}
            loading={isProcessing}
            disabled={isProcessing}
          >
            {isEditing ? '重新生成' : '重新处理'}
          </Button>
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
    backgroundColor: '#fff',
  },
  tabContainer: {
    padding: 16,
    paddingBottom: 8,
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
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  pendingText: {
    fontSize: 18,
    color: '#ff9800',
    marginBottom: 8,
  },
  pendingHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  processButton: {
    marginTop: 8,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  transcriptInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    minHeight: 200,
    padding: 0,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  playbackTime: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
