import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Animated, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Appbar, Text, ActivityIndicator } from 'react-native-paper';
import { useMeetingStore, useSettingsStore } from '../store';
import {
  segmentedRecorder,
  processSegmentedMeeting,
  transcribeAudio,
  type RecordedSegment,
} from '../services';
import { formatDuration, generateMeetingTitle, skeuColors, skeuStyles } from '../utils';
import { SkeuDialog } from '../components';

export const RecordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { addMeeting, updateMeeting } = useMeetingStore();
  const { settings } = useSettingsStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(1);
  const [totalSegments, setTotalSegments] = useState(1);
  const [isStopping, setIsStopping] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [streamStatus, setStreamStatus] = useState('');

  // Dialog state for "Discard Recording"
  const [discardDialogVisible, setDiscardDialogVisible] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const segmentDraftsRef = useRef<Record<number, string>>({});
  const segmentJobsRef = useRef<Map<number, Promise<string>>>(new Map());
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const cleanStreamingText = (text: string): string => text
    .replace(/<\|(?:im_start|im_end|endoftext|eot_id)\|>/g, '')
    .replace(/<asr_text>/gi, '')
    .replace(/^language\s+[A-Za-z-]+\s*/i, '')
    .trim();

  const updateLiveTranscript = () => {
    const preview = Object.entries(segmentDraftsRef.current)
      .sort(([a], [b]) => Number(a) - Number(b))
      .filter(([, text]) => text.trim())
      .map(([segment, text]) => `第 ${segment} 段\n${cleanStreamingText(text)}`)
      .join('\n\n');
    if (mountedRef.current) setLiveTranscript(preview);
  };

  const queueSegmentStream = (segment: RecordedSegment, segmentNumber: number) => {
    if (!settings.recordingAutoTranscribe || !settings.recordingStreaming) return;

    segmentDraftsRef.current[segmentNumber] = '';
    const previousJob = Array.from(segmentJobsRef.current.values()).pop();
    const job = (previousJob || Promise.resolve(''))
      .catch(() => '')
      .then(async () => {
        if (mountedRef.current) setStreamStatus(`第 ${segmentNumber} 段正在流式转写`);
        const transcript = await transcribeAudio(segment.uri, settings, {
          onToken: (token) => {
            segmentDraftsRef.current[segmentNumber] += token;
            updateLiveTranscript();
          },
        });
        // The final normalized transcript wins over incremental model tokens.
        segmentDraftsRef.current[segmentNumber] = transcript;
        updateLiveTranscript();
        return transcript;
      });

    segmentJobsRef.current.set(segmentNumber, job);
    job.then(() => {
      if (mountedRef.current) setStreamStatus(`已收到第 ${segmentNumber} 段转写`);
    }).catch((error) => {
      console.error(`Streaming transcription failed for segment ${segmentNumber}:`, error);
      if (mountedRef.current) setStreamStatus(`第 ${segmentNumber} 段转写稍后重试`);
    });
  };

  // 脉冲动画
  useEffect(() => {
    if (isRecording && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isPaused]);

  // 计时器
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      segmentDraftsRef.current = {};
      segmentJobsRef.current.clear();
      setLiveTranscript('');
      setStreamStatus(
        settings.recordingStreaming
          ? settings.sttProvider === 'local_r2t2'
            ? '等待第一段切片'
            : '切片后立即处理'
          : '录音中，停止后处理'
      );

      segmentedRecorder.setOnSegmentComplete((segment, current, total) => {
        setCurrentSegment(current + 1); // 显示正在录制的段号
        setTotalSegments(total + 1);
        queueSegmentStream(segment, current);
      });
      segmentedRecorder.setOnSegmentError((error) => {
        console.error('Automatic segment save failed:', error);
        if (mountedRef.current) setStreamStatus('切片保存遇到问题，将在停止后重试');
      });

      await segmentedRecorder.startRecording(settings.recordingSegmentMinutes || 5);
      setIsRecording(true);
      setDuration(0);
      setCurrentSegment(1);
      setTotalSegments(1);
    } catch (error: any) {
      Alert.alert('录音失败', error.message);
    }
  };

  const stopRecording = async () => {
    if (isStopping) return;
    setIsStopping(true);
    try {
      const { segments, totalDuration } = await segmentedRecorder.stopRecording();
      setIsRecording(false);

      // 提取所有段的 URI
      const audioUris = segments.map((seg: RecordedSegment) => seg.uri);
      const firstUri = audioUris[0] || '';

      // 创建会议记录
      const title = generateMeetingTitle();
      const meetingId = await addMeeting({
        title,
        audioUri: firstUri, // 向后兼容
        audioSegments: audioUris, // 新增：多段音频
        duration: totalDuration || duration,
      });

      const existingTranscripts = segments.map((_, index) => segmentJobsRef.current.get(index + 1));
      const shouldProcess = settings.recordingAutoTranscribe;

      // 录音完成后立即离开录音页，切片转写和总结继续在会议列表里后台运行。
      navigation.goBack();
      if (shouldProcess) {
        void processSegmentedRecording(meetingId, audioUris, existingTranscripts);
      }
    } catch (error: any) {
      setIsStopping(false);
      Alert.alert('停止录音失败', error.message);
    }
  };

  const processSegmentedRecording = async (
    meetingId: string,
    audioUris: string[],
    existingTranscripts: Array<string | Promise<string> | undefined>
  ) => {
    try {
      const result = await processSegmentedMeeting(
        audioUris,
        settings,
        (status: string) => {
          if (status === 'transcribing') {
            updateMeeting(meetingId, { status: 'transcribing' });
          } else if (status === 'summarizing') {
            updateMeeting(meetingId, { status: 'summarizing' });
          }
        },
        {
          existingTranscripts,
          onSegmentToken: (segment, token) => {
            // The screen is normally gone by now, but keeping the callback here
            // lets a fast stop retain the same streaming semantics.
            segmentDraftsRef.current[segment] = `${segmentDraftsRef.current[segment] || ''}${token}`;
          },
        }
      );

      updateMeeting(meetingId, {
        transcript: result.transcript,
        summary: result.summary,
        status: 'done',
      });

    } catch (error: any) {
      updateMeeting(meetingId, {
        status: 'error',
        errorMessage: error.message,
      });
    }
  };

  const handleBack = () => {
    if (isRecording) {
      setDiscardDialogVisible(true);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        {/* Skeuomorphic Back Button */}
        <TouchableOpacity style={styles.appBarButton} onPress={handleBack} activeOpacity={0.9}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={skeuColors.textPrimary} />
        </TouchableOpacity>
        <Appbar.Content title="录音" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.content}>
        {/* 录音指示器 */}
        <View style={styles.indicatorContainer}>
          <Animated.View
            style={[
              styles.recordIndicator,
              isRecording ? styles.recordIndicatorActive : styles.recordIndicatorIdle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
        </View>

        {/* 时长显示 */}
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>

        {/* 分段信息 */}
        {isRecording && totalSegments > 0 && (
          <Text style={styles.segmentText}>
            第 {currentSegment} 段 {totalSegments > 1 ? `(共 ${totalSegments} 段)` : ''}
          </Text>
        )}

        {/* 状态文字 */}
        <Text style={styles.statusText}>
          {isStopping ? '正在保存录音...' : isRecording ? (isPaused ? '已暂停' : '录音中...') : '准备录音'}
        </Text>

        {isRecording && settings.recordingAutoTranscribe && (
          <View style={styles.livePanel}>
            <View style={styles.livePanelHeader}>
              <View style={styles.livePanelTitleRow}>
                <MaterialCommunityIcons name="text-box-search-outline" size={18} color={skeuColors.primary} />
                <Text style={styles.livePanelTitle}>
                  {settings.sttProvider === 'local_r2t2' && settings.recordingStreaming ? '实时转写' : '后台转写'}
                </Text>
              </View>
              <Text style={styles.livePanelStatus}>{streamStatus || '等待切片'}</Text>
            </View>
            <ScrollView style={styles.liveTextScroll} nestedScrollEnabled>
              <Text style={styles.liveText}>
                {liveTranscript || (
                  settings.sttProvider === 'local_r2t2' && settings.recordingStreaming
                    ? '切片保存后，文字会在这里逐步出现'
                    : '录音完成后，结果会在会议列表里更新'
                )}
              </Text>
            </ScrollView>
          </View>
        )}

        {/* 控制按钮 */}
        <View style={styles.controls}>
          {!isRecording ? (
            <TouchableOpacity
              style={styles.mainButton}
              onPress={startRecording}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="microphone" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.mainButtonLabel}>开始录音</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
              disabled={isStopping}
              activeOpacity={0.9}
            >
              {isStopping ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="stop" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.mainButtonLabel}>停止录音</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 提示 */}
        <Text style={styles.hintText}>
          每 {settings.recordingSegmentMinutes || 5} 分钟后台保存一段，录音不中断
        </Text>
      </View>

      {/* Discard Recording Dialog */}
      <SkeuDialog
        visible={discardDialogVisible}
        title="放弃录音"
        message="确定要放弃当前录音吗？"
        buttons={[
          {
            text: '取消',
            style: 'cancel',
            onPress: () => setDiscardDialogVisible(false),
          },
          {
            text: '放弃',
            style: 'destructive',
            onPress: async () => {
              setDiscardDialogVisible(false);
              await segmentedRecorder.stopRecording().catch(() => { });
              await segmentedRecorder.deleteAllSegments().catch(() => { });
              segmentJobsRef.current.clear();
              segmentDraftsRef.current = {};
              navigation.goBack();
            },
          },
        ]}
        onDismiss={() => setDiscardDialogVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: skeuColors.background,
  },
  header: {
    backgroundColor: skeuColors.background,
    elevation: 0,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        borderBottomWidth: 0,
      }
    })
  },
  headerTitle: {
    color: skeuColors.textPrimary,
    fontWeight: '600',
    fontSize: 18,
  },
  appBarButton: {
    width: 40,
    height: 40,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...skeuStyles.neumorphicCard, // Convex style
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  indicatorContainer: {
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIndicator: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIndicatorIdle: {
    ...skeuStyles.neumorphicCard, // Use shared Convex style (includes backgroundColor)
    borderRadius: 70, // Force circle (override neumorphicCard radius)
  },
  recordIndicatorActive: {
    borderRadius: 70,
    backgroundColor: skeuColors.recordRed,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.recordRed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, // 0.6 -> 0.4 (Less intense glow)
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 0,
  },
  durationContainer: {
    ...skeuStyles.neumorphicInset,
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 42,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    color: skeuColors.textPrimary,
  },
  segmentText: {
    fontSize: 14,
    color: skeuColors.primary,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: skeuColors.textSecondary,
    marginBottom: 24,
    marginTop: 8,
  },
  livePanel: {
    width: '100%',
    maxWidth: 420,
    minHeight: 110,
    maxHeight: 180,
    marginBottom: 24,
    padding: 14,
    ...skeuStyles.neumorphicInset,
    borderRadius: 20,
  },
  livePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  livePanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePanelTitle: {
    color: skeuColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  livePanelStatus: {
    color: skeuColors.textMuted,
    fontSize: 12,
    maxWidth: '55%',
    textAlign: 'right',
  },
  liveTextScroll: {
    flex: 1,
  },
  liveText: {
    color: skeuColors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  mainButton: {
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    ...skeuStyles.neumorphicCard, // Convex style
    backgroundColor: skeuColors.primary, // Override for accent color
  },
  stopButton: {
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    ...skeuStyles.neumorphicCard, // Convex style
    backgroundColor: skeuColors.recordRed, // Override for stop color
  },
  mainButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 1,
  },
  hintText: {
    fontSize: 13,
    color: skeuColors.textMuted,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  processingIndicator: {
    ...skeuStyles.neumorphicCard,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 0,
    marginBottom: 12,
    color: skeuColors.textPrimary,
  },
  processingHint: {
    fontSize: 15,
    color: skeuColors.textSecondary,
    textAlign: 'center',
  },
});
