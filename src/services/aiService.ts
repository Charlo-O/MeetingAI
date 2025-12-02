import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { AppSettings } from '../types';

// 配置 axios 超时时间
const createAxiosInstance = (timeout = 120000) => {
  return axios.create({ timeout });
};

// 1. 语音转文字 (STT) - Multipart/form-data
export const transcribeAudio = async (
  audioUri: string,
  settings: AppSettings
): Promise<string> => {
  const formData = new FormData();
  
  // 获取文件信息
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error('录音文件不存在');
  }
  
  // React Native 中 FormData 的文件对象格式
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  } as any);
  
  formData.append('model', settings.sttModel || 'whisper-1');

  try {
    const api = createAxiosInstance();
    const baseUrl = settings.sttBaseUrl.replace(/\/$/, ''); // 移除末尾斜杠
    
    const response = await api.post(
      `${baseUrl}/audio/transcriptions`, 
      formData, 
      {
        headers: {
          'Authorization': `Bearer ${settings.sttApiKey}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.text;
  } catch (error: any) {
    console.error('STT Error:', error);
    if (error.response) {
      throw new Error(`语音转文字失败: ${error.response.data?.error?.message || error.response.status}`);
    }
    throw new Error(`语音转文字失败: ${error.message}`);
  }
};

// 2. 大模型总结 (LLM) - JSON
export const summarizeText = async (
  text: string,
  settings: AppSettings
): Promise<string> => {
  const messages = [
    { 
      role: 'system', 
      content: settings.systemPrompt || '你是一个会议助手，请总结以下内容。' 
    },
    { role: 'user', content: text }
  ];

  try {
    const api = createAxiosInstance();
    const baseUrl = settings.llmBaseUrl.replace(/\/$/, '');
    
    const response = await api.post(
      `${baseUrl}/chat/completions`,
      {
        model: settings.llmModel,
        messages: messages,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${settings.llmApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('LLM Error:', error);
    if (error.response) {
      throw new Error(`生成总结失败: ${error.response.data?.error?.message || error.response.status}`);
    }
    throw new Error(`生成总结失败: ${error.message}`);
  }
};

// 3. 语音合成 (TTS) - 下载为文件
export const textToSpeech = async (
  text: string,
  settings: AppSettings,
  savePath: string
): Promise<string> => {
  try {
    const baseUrl = settings.ttsBaseUrl.replace(/\/$/, '');
    const api = createAxiosInstance();
    
    const audioResponse = await api.post(
      `${baseUrl}/audio/speech`,
      {
        model: settings.ttsModel || 'tts-1',
        input: text,
        voice: settings.ttsVoice || 'alloy',
      },
      {
        headers: {
          'Authorization': `Bearer ${settings.ttsApiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );
    
    // 将 arraybuffer 转换为 base64 并保存
    const bytes = new Uint8Array(audioResponse.data);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    await FileSystem.writeAsStringAsync(savePath, base64, {
      encoding: 'base64',
    });
    
    return savePath;
  } catch (error: any) {
    console.error('TTS Error:', error);
    if (error.response) {
      throw new Error(`语音合成失败: ${error.response.data?.error?.message || error.response.status}`);
    }
    throw new Error(`语音合成失败: ${error.message}`);
  }
};

// 处理完整的会议记录流程
export const processMeeting = async (
  audioUri: string,
  settings: AppSettings,
  onProgress?: (status: 'transcribing' | 'summarizing') => void
): Promise<{ transcript: string; summary: string }> => {
  // 1. 转录
  onProgress?.('transcribing');
  const transcript = await transcribeAudio(audioUri, settings);
  
  // 2. 总结
  onProgress?.('summarizing');
  const summary = await summarizeText(transcript, settings);
  
  return { transcript, summary };
};
