import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// 录音配置 - 使用 AAC/m4a 格式（OpenAI 友好且体积小）
// 使用 48kbps 比特率，30分钟约 10MB，60分钟约 20MB
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,  // 16kHz 足够语音识别
    numberOfChannels: 1, // 单声道减小体积
    bitRate: 48000,      // 48kbps
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 48000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 48000,
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

// 导出单例
export const audioRecorder = new AudioRecorder();
