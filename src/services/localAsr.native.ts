import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, LlamaContext } from 'llama.rn';
import { decodeAudioData } from 'react-native-audio-api';
import type { LocalAsrOptions } from './localAsr';

// Confucius4-R2T2 的 Q8 配对文件。Q4_K_M 主模型没有 mmproj，不能用于音频输入。
const MODEL_URL =
  'https://modelscope.cn/models/netease-youdao/Confucius4-R2T2-GGUF/resolve/master/Confucius4-R2T2-Q8_0.gguf';
const MMPROJ_URL =
  'https://modelscope.cn/models/netease-youdao/Confucius4-R2T2-GGUF/resolve/master/mmproj-Confucius4-R2T2-Q8_0.gguf';
const MODEL_DIR = `${FileSystem.documentDirectory}models/confucius4-r2t2-q8`;
const MODEL_PATH = `${MODEL_DIR}/Confucius4-R2T2-Q8_0.gguf`;
const MMPROJ_PATH = `${MODEL_DIR}/mmproj-Confucius4-R2T2-Q8_0.gguf`;

let contextPromise: Promise<LlamaContext> | null = null;

const asFileUri = (path: string): string => (path.startsWith('file://') ? path : `file://${path}`);

const ensureDirectory = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
};

const downloadIfNeeded = async (
  url: string,
  destination: string,
  stage: 'model' | 'mmproj',
  onProgress?: LocalAsrOptions['onProgress']
): Promise<void> => {
  const info = await FileSystem.getInfoAsync(destination);
  // A truncated model must not be handed to llama.cpp. These lower bounds also
  // make an interrupted first download recoverable on the next launch.
  const minimumBytes = stage === 'model' ? 100 * 1024 * 1024 : 1024 * 1024;
  if (info.exists && ((info as any).size || 0) >= minimumBytes) {
    onProgress?.(1, stage);
    return;
  }

  if (info.exists) {
    await FileSystem.deleteAsync(destination, { idempotent: true });
  }

  const task = FileSystem.createDownloadResumable(
    url,
    destination,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const progress = totalBytesExpectedToWrite > 0
        ? totalBytesWritten / totalBytesExpectedToWrite
        : 0;
      onProgress?.(progress, stage);
    }
  );
  const result = await task.downloadAsync();
  if (!result?.uri) {
    throw new Error(`本地 ASR ${stage === 'model' ? '主模型' : '音频投影'}下载失败`);
  }
};

const getContext = async (options: LocalAsrOptions = {}): Promise<LlamaContext> => {
  if (!contextPromise) {
    contextPromise = (async () => {
      await ensureDirectory();
      await downloadIfNeeded(MODEL_URL, MODEL_PATH, 'model', options.onProgress);
      await downloadIfNeeded(MMPROJ_URL, MMPROJ_PATH, 'mmproj', options.onProgress);

      const context = await initLlama(
        {
          model: asFileUri(MODEL_PATH),
          n_ctx: 8192,
          n_batch: 512,
          n_gpu_layers: 99,
          use_mlock: false,
          ctx_shift: false,
          flash_attn_type: 'on',
        },
        (progress) => options.onProgress?.(progress, 'model')
      );

      const multimodalReady = await context.initMultimodal({
        path: asFileUri(MMPROJ_PATH),
        use_gpu: true,
      });
      if (!multimodalReady) {
        await context.release();
        throw new Error('llama.rn 无法加载 R2T2 的 mmproj 音频投影文件');
      }

      const support = await context.getMultimodalSupport();
      if (!support.audio) {
        await context.release();
        throw new Error('当前 llama.cpp 构建不支持音频输入');
      }
      return context;
    })().catch((error) => {
      contextPromise = null;
      throw error;
    });
  }
  return contextPromise;
};

const toLocalPath = (uri: string): string => {
  if (uri.startsWith('file://')) return uri.slice('file://'.length);
  if (uri.startsWith('/')) return uri;
  throw new Error('本地 ASR 只接受应用沙盒中的 file URI');
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

const audioBufferToWav = (audioBuffer: {
  length: number;
  sampleRate: number;
  numberOfChannels: number;
  getChannelData: (channel: number) => Float32Array;
}): Uint8Array => {
  const channelCount = Math.max(1, audioBuffer.numberOfChannels);
  const left = audioBuffer.getChannelData(0);
  const right = channelCount > 1 ? audioBuffer.getChannelData(1) : left;
  const wav = new Uint8Array(44 + audioBuffer.length * 2);
  const view = new DataView(wav.buffer);
  const writeAscii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + audioBuffer.length * 2, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, audioBuffer.length * 2, true);
  for (let i = 0; i < audioBuffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, (left[i] + right[i]) / (channelCount > 1 ? 2 : 1)));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return wav;
};

const prepareAudio = async (audioUri: string): Promise<{ uri: string; temporary: boolean }> => {
  // llama.rn 的 multimodal API 接受 wav/mp3。react-native-audio-api 在设备本地
  // 解码 expo-av 生成的 m4a，再写成 16kHz、单声道 PCM WAV，不需要 FFmpeg 或上传。
  const sourceUri = asFileUri(toLocalPath(audioUri));
  const decoded = await decodeAudioData(sourceUri, 16000);
  const outputDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  const outputPath = `${outputDirectory}r2t2-${Date.now()}.wav`;
  const outputUri = asFileUri(toLocalPath(outputPath));
  await FileSystem.writeAsStringAsync(outputUri, bytesToBase64(audioBufferToWav(decoded)), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { uri: outputUri, temporary: true };
};

const cleanTranscript = (text: string): string => {
  const normalized = text.replace(/<\|(?:im_start|im_end|endoftext|eot_id)\|>/g, '').trim();
  const tagIndex = normalized.indexOf('<asr_text>');
  if (tagIndex >= 0) return normalized.slice(tagIndex + '<asr_text>'.length).trim();
  return normalized.replace(/^language\s+[A-Za-z-]+\s*/i, '').trim();
};

export const ensureLocalAsrModel = async (options: LocalAsrOptions = {}): Promise<void> => {
  await getContext(options);
};

export const transcribeAudioLocal = async (
  audioUri: string,
  options: LocalAsrOptions = {}
): Promise<string> => {
  const context = await getContext(options);
  const preparedAudio = await prepareAudio(audioUri);
  try {
    await context.clearCache(true);
    // R2T2 follows the Qwen3-ASR prompt contract. Passing the prompt directly
    // avoids relying on a chat_template entry that is absent in some GGUF builds.
    // llama.rn replaces <__media__> with the audio embedding chunk from mmproj.
    const result = await context.completion({
      prompt: '<|im_start|>system\n<|im_end|>\n<|im_start|>user\n<__media__><|im_end|>\n<|im_start|>assistant\nlanguage Chinese<asr_text>',
      media_paths: [preparedAudio.uri.replace(/^file:\/\//, '')],
      n_predict: 2048,
      temperature: 0,
      top_p: 1,
    });
    return cleanTranscript(result.text || '');
  } finally {
    if (preparedAudio.temporary) {
      await FileSystem.deleteAsync(preparedAudio.uri, { idempotent: true }).catch(() => undefined);
    }
  }
};

export const releaseLocalAsrModel = async (): Promise<void> => {
  if (!contextPromise) return;
  const context = await contextPromise.catch(() => null);
  contextPromise = null;
  if (context) await context.release();
};
