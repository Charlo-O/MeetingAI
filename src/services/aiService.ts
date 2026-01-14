import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { AppSettings } from '../types';

// 文件大小限制 (25MB for OpenAI Whisper)
// 新录音配置下：30分钟约10MB，60分钟约20MB，可支持约75分钟
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// 配置 axios 超时时间 (默认 5 分钟)
const createAxiosInstance = (timeout = 300000) => {
  return axios.create({ timeout });
};

// ===== Whisper STT (OpenAI 兼容接口) =====
const transcribeAudioWhisper = async (
  audioUri: string,
  settings: AppSettings
): Promise<string> => {
  const formData = new FormData();

  // 获取文件信息
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error('录音文件不存在');
  }

  // 检查文件大小
  const fileSize = (fileInfo as any).size || 0;
  if (fileSize > MAX_FILE_SIZE) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    throw new Error(`音频文件过大 (${sizeMB}MB)，超过 25MB 限制。建议录制较短的会议或分段录制。`);
  }


  // React Native 中需要将文件转为 base64 后创建 Blob
  // 这样可以绕过 URI 对象的兼容性问题
  console.log('[STT Debug] Reading audio file as base64...');
  const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 将 base64 转为 Blob
  const byteCharacters = atob(base64Audio);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const audioBlob = new Blob([byteArray], { type: 'audio/mp4' });

  // 创建一个文件对象
  const audioFile = new File([audioBlob], 'audio.m4a', { type: 'audio/mp4' });

  formData.append('file', audioFile);
  formData.append('model', settings.sttModel || 'whisper-1');

  console.log('[STT Debug] File converted to Blob, size:', audioBlob.size, 'bytes');

  try {
    const baseUrl = settings.sttBaseUrl.replace(/\/$/, ''); // 移除末尾斜杠
    const requestUrl = `${baseUrl}/audio/transcriptions`;

    // 详细日志：记录请求信息
    console.log('[STT Request] URL:', requestUrl);
    console.log('[STT Request] Model:', settings.sttModel);
    console.log('[STT Request] File size:', fileSize, 'bytes');
    console.log('[STT Request] API Key (first 10 chars):', settings.sttApiKey.substring(0, 10) + '...');

    // 使用 fetch 而不是 axios，因为 React Native 的 FormData 与 fetch 兼容性更好
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.sttApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('[STT Error] Status:', response.status);
      console.error('[STT Error] Status Text:', response.statusText);
      console.error('[STT Error] Response Data:', JSON.stringify(errorData, null, 2));

      const errorMessage = errorData?.error?.message
        || errorData?.message
        || response.statusText
        || `HTTP ${response.status}`;

      throw new Error(`语音转文字失败 (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('❌ Whisper STT Error:', error);

    // 如果不是我们抛出的错误，说明是网络或其他问题
    if (!error.message.includes('语音转文字失败')) {
      throw new Error(`语音转文字失败: ${error.message}`);
    }
    throw error;
  }
};

// ===== AssemblyAI STT =====

// 步骤 1: 上传音频文件到 AssemblyAI
const uploadAudioToAssemblyAI = async (
  audioUri: string,
  apiKey: string
): Promise<string> => {
  console.log('[AssemblyAI] 读取音频文件...');

  // 读取文件为 base64
  const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 将 base64 转为二进制数组
  const byteCharacters = atob(base64Audio);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  console.log('[AssemblyAI] 上传文件，大小:', byteArray.length, 'bytes');

  // 直接上传二进制数据（使用 Uint8Array 的 buffer）
  const response = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'content-type': 'application/octet-stream',
    },
    body: byteArray.buffer, // 使用 ArrayBuffer
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`上传文件失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.upload_url;
};

// 步骤 2: 提交转写任务
const submitAssemblyAITranscript = async (
  uploadUrl: string,
  apiKey: string
): Promise<string> => {
  console.log('[AssemblyAI] 提交转写任务...');

  const response = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadUrl,
      language_code: 'zh', // 设置为中文
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`提交转写任务失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.id;
};

// 步骤 3: 轮询转写结果
const pollAssemblyAITranscript = async (
  transcriptId: string,
  apiKey: string,
  maxAttempts = 300, // 最多等待 5 分钟
  intervalMs = 1000
): Promise<string> => {
  console.log('[AssemblyAI] 等待转写完成...');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: {
          'authorization': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`获取转写状态失败 (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'completed') {
      console.log('[AssemblyAI] 转写完成！');
      return data.text;
    } else if (data.status === 'error') {
      throw new Error(`转写失败: ${data.error}`);
    }

    // 状态为 queued 或 processing，继续等待
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('转写任务超时，请稍后重试');
};

// AssemblyAI 完整流程
const transcribeAudioAssemblyAI = async (
  audioUri: string,
  settings: AppSettings
): Promise<string> => {
  // 步骤 1: 上传文件
  const uploadUrl = await uploadAudioToAssemblyAI(audioUri, settings.sttApiKey);

  // 步骤 2: 提交转写
  const transcriptId = await submitAssemblyAITranscript(uploadUrl, settings.sttApiKey);

  // 步骤 3: 轮询结果
  const transcript = await pollAssemblyAITranscript(transcriptId, settings.sttApiKey);

  return transcript;
};

// ===== 统一的语音转文字接口 =====
export const transcribeAudio = async (
  audioUri: string,
  settings: AppSettings
): Promise<string> => {
  if (settings.sttProvider === 'assemblyai') {
    return transcribeAudioAssemblyAI(audioUri, settings);
  }
  // 默认使用 Whisper
  return transcribeAudioWhisper(audioUri, settings);
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
      encoding: FileSystem.EncodingType.Base64,
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

// ===== 批量转写与合并（用于分段录音） =====

// 批量转写多段音频并合并结果
export const transcribeMultipleAudios = async (
  audioUris: string[],
  settings: AppSettings,
  onProgress?: (current: number, total: number) => void
): Promise<string> => {
  try {
    // 并行转写所有段
    const transcripts = await Promise.all(
      audioUris.map(async (uri, index) => {
        const transcript = await transcribeAudio(uri, settings);
        onProgress?.(index + 1, audioUris.length);
        return { segment: index + 1, text: transcript };
      })
    );

    // 合并转写结果，添加段落标记
    const mergedText = transcripts
      .map(({ segment, text }) => `[第 ${segment} 段]\n${text}`)
      .join('\n\n---\n\n');

    return mergedText;
  } catch (error: any) {
    console.error('Batch transcription error:', error);
    throw new Error(`批量转写失败: ${error.message}`);
  }
};

// 处理分段录音的完整流程
export const processSegmentedMeeting = async (
  audioUris: string[],
  settings: AppSettings,
  onProgress?: (status: 'transcribing' | 'summarizing', current?: number, total?: number) => void
): Promise<{ transcript: string; summary: string }> => {
  // 1. 批量转录
  onProgress?.('transcribing');
  const transcript = await transcribeMultipleAudios(
    audioUris,
    settings,
    (current, total) => onProgress?.('transcribing', current, total)
  );

  // 2. 总结
  onProgress?.('summarizing');
  const summary = await summarizeText(transcript, settings);

  return { transcript, summary };
};
