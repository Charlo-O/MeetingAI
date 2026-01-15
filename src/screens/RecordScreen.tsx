import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Animated, Platform } from 'react-native';
import {
  Appbar,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { Audio } from 'expo-av';
import { useMeetingStore, useSettingsStore } from '../store';
import { segmentedRecorder, processMeeting, processSegmentedMeeting } from '../services';
import { formatDuration, generateMeetingTitle, skeuColors, skeuStyles } from '../utils';

export const RecordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { addMeeting, updateMeeting } = useMeetingStore();
  const { settings } = useSettingsStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(1);
  const [totalSegments, setTotalSegments] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      // 设置分段回调
      segmentedRecorder.setOnSegmentComplete((current, total) => {
        setCurrentSegment(current + 1); // 显示正在录制的段号
        setTotalSegments(total + 1);
      });

      await segmentedRecorder.startRecording();
      setIsRecording(true);
      setDuration(0);
      setCurrentSegment(1);
      setTotalSegments(1);
    } catch (error: any) {
      Alert.alert('录音失败', error.message);
    }
  };

  const stopRecording = async () => {
    try {
      const { segments, totalDuration } = await segmentedRecorder.stopRecording();
      setIsRecording(false);

      // 提取所有段的 URI
      const audioUris = segments.map((seg: { uri: string; duration: number }) => seg.uri);
      const firstUri = audioUris[0] || '';

      // 创建会议记录
      const title = generateMeetingTitle();
      const meetingId = await addMeeting({
        title,
        audioUri: firstUri, // 向后兼容
        audioSegments: audioUris, // 新增：多段音频
        duration: totalDuration || duration,
      });

      // 询问是否立即处理
      Alert.alert(
        '录音完成',
        `录制了 ${audioUris.length} 段音频，是否立即进行语音转文字和总结？`,
        [
          {
            text: '稍后处理',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
          {
            text: '立即处理',
            onPress: () => processSegmentedRecording(meetingId, audioUris),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('停止录音失败', error.message);
    }
  };

  const processSegmentedRecording = async (meetingId: string, audioUris: string[]) => {
    setIsProcessing(true);

    try {
      const result = await processSegmentedMeeting(
        audioUris,
        settings,
        (status: string, current?: number, total?: number) => {
          if (status === 'transcribing') {
            const progress = current && total ? ` (${current}/${total})` : '';
            setProcessingStatus(`正在转录语音...${progress}`);
            updateMeeting(meetingId, { status: 'transcribing' });
          } else if (status === 'summarizing') {
            setProcessingStatus('正在生成总结...');
            updateMeeting(meetingId, { status: 'summarizing' });
          }
        }
      );

      updateMeeting(meetingId, {
        transcript: result.transcript,
        summary: result.summary,
        status: 'done',
      });

      setIsProcessing(false);
      navigation.replace('Detail', { meetingId });
    } catch (error: any) {
      setIsProcessing(false);
      updateMeeting(meetingId, {
        status: 'error',
        errorMessage: error.message,
      });
      Alert.alert('处理失败', error.message, [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleBack = () => {
    if (isRecording) {
      Alert.alert(
        '放弃录音',
        '确定要放弃当前录音吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '放弃',
            style: 'destructive',
            onPress: async () => {
              await segmentedRecorder.stopRecording().catch(() => { });
              await segmentedRecorder.deleteAllSegments().catch(() => { });
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="处理中" titleStyle={styles.headerTitle} />
        </Appbar.Header>
        <View style={styles.processingContainer}>
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="large" color={skeuColors.primary} />
          </View>
          <Text style={styles.processingText}>{processingStatus}</Text>
          <Text style={styles.processingHint}>
            请耐心等待，这可能需要一些时间...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleBack} color={skeuColors.textPrimary} />
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
          {isRecording ? (isPaused ? '已暂停' : '录音中...') : '准备录音'}
        </Text>

        {/* 控制按钮 */}
        <View style={styles.controls}>
          {!isRecording ? (
            <View style={styles.mainButtonWrapper}>
              <Button
                mode="contained"
                onPress={startRecording}
                style={styles.mainButton}
                contentStyle={styles.mainButtonContent}
                labelStyle={styles.mainButtonLabel}
                icon="microphone"
              >
                开始录音
              </Button>
            </View>
          ) : (
            <View style={styles.mainButtonWrapper}>
              <Button
                mode="contained"
                onPress={stopRecording}
                style={styles.stopButton}
                contentStyle={styles.mainButtonContent}
                labelStyle={styles.mainButtonLabel}
                icon="stop"
              >
                停止录音
              </Button>
            </View>
          )}
        </View>

        {/* 提示 */}
        <Text style={styles.hintText}>
          每 5 分钟自动保存一段，支持任意长时间录音
        </Text>
      </View>
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
    backgroundColor: skeuColors.background,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.2, // Softer
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 6,
    borderColor: skeuColors.backgroundDark,
  },
  recordIndicatorActive: {
    backgroundColor: skeuColors.recordRed,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.recordRed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 24, // Glow
      },
      android: {
        elevation: 12,
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
    marginBottom: 56,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  mainButtonWrapper: {
    // Optional
  },
  mainButton: {
    minWidth: 180,
    borderRadius: 24,
    backgroundColor: skeuColors.primary,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.primaryDark,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  stopButton: {
    minWidth: 180,
    borderRadius: 24,
    backgroundColor: skeuColors.recordRed,
    ...Platform.select({
      ios: {
        shadowColor: '#AA0000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainButtonContent: {
    paddingVertical: 10,
    paddingHorizontal: 24,
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
