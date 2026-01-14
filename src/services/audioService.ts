import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// 录音配置 - 使用 AAC/m4a 格式（OpenAI 友好且高质量）
// 使用 128kbps 比特率，32kHz 采样率
// 文件大小：30分钟约 28MB，5分钟约 4.7MB（分段后每段都在限制内）
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 32000,  // 32kHz 高质量语音
    numberOfChannels: 1, // 单声道减小体积
    bitRate: 128000,     // 128kbps
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 32000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;

  // 请求录音权限
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // 开始录音
  async startRecording(): Promise<void> {
    try {
      // 确保有权限
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('没有录音权限');
      }

      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 创建并开始录音
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      this.recording = recording;
    } catch (error) {
      console.error('Start recording failed:', error);
      throw error;
    }
  }

  // 停止录音并返回文件 URI
  async stopRecording(): Promise<{ uri: string; duration: number }> {
    if (!this.recording) {
      throw new Error('没有正在进行的录音');
    }

    try {
      await this.recording.stopAndUnloadAsync();

      // 重置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      if (!uri) {
        throw new Error('录音文件不存在');
      }

      // 计算时长（毫秒转秒）
      const duration = Math.round((status.durationMillis || 0) / 1000);

      this.recording = null;

      return { uri, duration };
    } catch (error) {
      console.error('Stop recording failed:', error);
      throw error;
    }
  }

  // 获取录音状态
  async getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
    if (!this.recording) {
      return null;
    }
    return await this.recording.getStatusAsync();
  }

  // 播放音频
  async playAudio(uri: string): Promise<Audio.Sound> {
    try {
      // 如果有正在播放的音频，先停止
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;
      await sound.playAsync();

      return sound;
    } catch (error) {
      console.error('Play audio failed:', error);
      throw error;
    }
  }

  // 停止播放
  async stopPlayback(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  // 删除录音文件
  async deleteRecording(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Delete recording failed:', error);
    }
  }
}

// ===== 分段录音器 =====
// 自动每 5 分钟保存一段，支持任意长时间录音

const SEGMENT_DURATION_MS = 5 * 60 * 1000; // 5 分钟

export class SegmentedRecorder {
  private recording: Audio.Recording | null = null;
  private segments: Array<{ uri: string; duration: number }> = [];
  private segmentTimer: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private currentSegmentStart: number = 0;
  private onSegmentComplete?: (segmentNumber: number, totalSegments: number) => void;

  // 设置分段完成回调
  setOnSegmentComplete(callback: (segmentNumber: number, totalSegments: number) => void) {
    this.onSegmentComplete = callback;
  }

  // 请求录音权限
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // 开始分段录音
  async startRecording(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('没有录音权限');
      }

      this.segments = [];
      this.startTime = Date.now();
      this.currentSegmentStart = Date.now();

      await this.startNewSegment();
    } catch (error) {
      console.error('Start segmented recording failed:', error);
      throw error;
    }
  }

  // 开始新的一段
  private async startNewSegment(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
    this.recording = recording;

    // 设置定时器，5分钟后自动保存当前段并开始新段
    this.segmentTimer = setTimeout(() => {
      this.saveCurrentSegmentAndContinue();
    }, SEGMENT_DURATION_MS);
  }

  // 保存当前段并继续录音
  private async saveCurrentSegmentAndContinue(): Promise<void> {
    if (!this.recording) return;

    try {
      // 停止当前录音
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      if (uri) {
        const duration = Math.round((status.durationMillis || 0) / 1000);
        this.segments.push({ uri, duration });

        // 通知 UI 更新
        this.onSegmentComplete?.(this.segments.length, this.segments.length);
      }

      this.recording = null;
      this.currentSegmentStart = Date.now();

      // 清除旧的定时器
      if (this.segmentTimer) {
        clearTimeout(this.segmentTimer);
        this.segmentTimer = null;
      }

      // 开始新的一段
      await this.startNewSegment();
    } catch (error) {
      console.error('Save segment and continue failed:', error);
      throw error;
    }
  }

  // 停止录音并返回所有段
  async stopRecording(): Promise<{ segments: Array<{ uri: string; duration: number }>; totalDuration: number }> {
    // 清除定时器
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }

    if (!this.recording) {
      // 如果没有正在录音，返回已有的段
      const totalDuration = this.segments.reduce((sum, seg) => sum + seg.duration, 0);
      return { segments: this.segments, totalDuration };
    }

    try {
      // 保存最后一段
      await this.recording.stopAndUnloadAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      if (uri) {
        const duration = Math.round((status.durationMillis || 0) / 1000);
        this.segments.push({ uri, duration });
      }

      this.recording = null;

      const totalDuration = this.segments.reduce((sum, seg) => sum + seg.duration, 0);
      return { segments: this.segments, totalDuration };
    } catch (error) {
      console.error('Stop segmented recording failed:', error);
      throw error;
    }
  }

  // 获取当前状态
  getStatus(): {
    isRecording: boolean;
    currentSegment: number;
    totalSegments: number;
    elapsedTime: number;
  } {
    const isRecording = this.recording !== null;
    const elapsedTime = this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

    return {
      isRecording,
      currentSegment: this.segments.length + (isRecording ? 1 : 0),
      totalSegments: this.segments.length + (isRecording ? 1 : 0),
      elapsedTime,
    };
  }

  // 删除所有段
  async deleteAllSegments(): Promise<void> {
    for (const segment of this.segments) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(segment.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(segment.uri);
        }
      } catch (error) {
        console.error('Delete segment failed:', error);
      }
    }
    this.segments = [];
  }
}

// 导出单例
export const audioRecorder = new AudioRecorder();
export const segmentedRecorder = new SegmentedRecorder();
