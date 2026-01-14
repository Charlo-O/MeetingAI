import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Animated } from 'react-native';
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
import { formatDuration, generateMeetingTitle } from '../utils';

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
        <Appbar.Header>
          <Appbar.Content title="处理中" />
        </Appbar.Header>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="录音" />
      </Appbar.Header>

      <View style={styles.content}>
        {/* 录音指示器 */}
        <View style={styles.indicatorContainer}>
          <Animated.View
            style={[
              styles.recordIndicator,
              {
                backgroundColor: isRecording ? '#f44336' : '#ccc',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        </View>

        {/* 时长显示 */}
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>

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
            <Button
              mode="contained"
              onPress={startRecording}
              style={styles.mainButton}
              contentStyle={styles.mainButtonContent}
              icon="microphone"
            >
              开始录音
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={stopRecording}
              style={[styles.mainButton, { backgroundColor: '#f44336' }]}
              contentStyle={styles.mainButtonContent}
              icon="stop"
            >
              停止录音
            </Button>
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  indicatorContainer: {
    marginBottom: 32,
  },
  recordIndicator: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  durationText: {
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  segmentText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 48,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  mainButton: {
    minWidth: 160,
  },
  mainButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  processingText: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  processingHint: {
    fontSize: 14,
    color: '#666',
  },
});
