import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, LlamaContext } from 'llama.rn';
import { releaseLocalAsrModel } from './localAsr';
import type { LocalLlmOptions } from './localLlm';

// ModelScope 上的指定本地总结模型。
const MODEL_URL =
  'https://modelscope.cn/models/empero-ai/Qwen3.8-2B-Distill-GGUF/resolve/master/Qwen3.8-2B-Q5_K_M.gguf';
const MODEL_SIZE = 1454786944;
const MODEL_DIR = `${FileSystem.documentDirectory}models/qwen3.8-2b-q5-k-m`;
const MODEL_PATH = `${MODEL_DIR}/Qwen3.8-2B-Q5_K_M.gguf`;
const MAX_INPUT_CHARS = 10000;

let contextPromise: Promise<LlamaContext> | null = null;

const asFileUri = (path: string): string => (path.startsWith('file://') ? path : `file://${path}`);

const ensureDirectory = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
};

const downloadModelIfNeeded = async (onProgress?: LocalLlmOptions['onProgress']): Promise<void> => {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  if (info.exists && (info as any).size === MODEL_SIZE) {
    onProgress?.(1, 'model');
    return;
  }

  if (info.exists) {
    await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  }

  const task = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const progress = totalBytesExpectedToWrite > 0
        ? totalBytesWritten / totalBytesExpectedToWrite
        : 0;
      onProgress?.(progress, 'model');
    }
  );
  const result = await task.downloadAsync();
  if (!result?.uri) {
    throw new Error('本地 Qwen3.8 模型下载失败');
  }

  const downloaded = await FileSystem.getInfoAsync(MODEL_PATH);
  if (!downloaded.exists || (downloaded as any).size !== MODEL_SIZE) {
    await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
    throw new Error('本地 Qwen3.8 模型文件不完整，请重试下载');
  }
};

const getContext = async (options: LocalLlmOptions = {}): Promise<LlamaContext> => {
  if (!contextPromise) {
    contextPromise = (async () => {
      // ASR 和 LLM 不同时驻留，降低 Android 真机内存峰值。
      await releaseLocalAsrModel();
      await ensureDirectory();
      await downloadModelIfNeeded(options.onProgress);

      return initLlama(
        {
          model: asFileUri(MODEL_PATH),
          n_ctx: 8192,
          n_batch: 256,
          n_ubatch: 128,
          n_gpu_layers: 99,
          use_mlock: false,
          ctx_shift: false,
          flash_attn_type: 'on',
        },
        (progress) => options.onProgress?.(progress, 'model')
      );
    })().catch((error) => {
      contextPromise = null;
      throw error;
    });
  }
  return contextPromise;
};

const cleanSummary = (text: string): string => {
  const withoutThinking = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  return withoutThinking
    .replace(/<\|(?:im_start|im_end|endoftext|eot_id)\|>/g, '')
    .trim();
};

const buildSystemPrompt = (systemPrompt: string): string => [
  systemPrompt || '你是一个专业的会议助手。',
  '请只根据会议原文生成可靠的 Markdown 总结，不要编造原文中没有的信息。',
  '请严格包含：会议摘要、关键结论、已做决定、待办事项、风险与未决问题。',
].join('\n');

const splitTranscript = (text: string): string[] => {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > MAX_INPUT_CHARS) {
    const candidate = remaining.lastIndexOf('\n', MAX_INPUT_CHARS);
    const splitAt = candidate > MAX_INPUT_CHARS * 0.6 ? candidate : MAX_INPUT_CHARS;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
};

const completeSummary = async (
  context: LlamaContext,
  systemPrompt: string,
  userText: string,
  nPredict: number
): Promise<string> => {
  await context.clearCache(true);
  const result = await context.completion({
    messages: [
      { role: 'system', content: buildSystemPrompt(systemPrompt) },
      { role: 'user', content: userText },
    ],
    n_predict: nPredict,
    temperature: 0.2,
    top_k: 20,
    top_p: 0.9,
    enable_thinking: false,
    reasoning_format: 'none',
    speculative: false,
    stop: ['<|im_end|>', '<|endoftext|>'],
  });

  const summary = cleanSummary(result.text || '');
  if (!summary) {
    throw new Error('本地 Qwen3.8 未生成有效总结');
  }
  return summary;
};

export const ensureLocalLlmModel = async (options: LocalLlmOptions = {}): Promise<void> => {
  await getContext(options);
};

export const summarizeTextLocal = async (
  text: string,
  systemPrompt: string,
  options: LocalLlmOptions = {}
): Promise<string> => {
  const context = await getContext(options);
  const chunks = splitTranscript(text);
  if (chunks.length <= 1) {
    return completeSummary(
      context,
      systemPrompt,
      `${chunks[0] || ''}\n\n请直接输出最终 Markdown，不要输出思考过程。`,
      1024
    );
  }

  const partialSummaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    partialSummaries.push(await completeSummary(
      context,
      systemPrompt,
      `这是会议原文第 ${i + 1}/${chunks.length} 段。请提取这一段的事实、关键结论、决定和待办，不要补充原文没有的信息。\n\n${chunks[i]}`,
      768
    ));
  }

  return completeSummary(
    context,
    systemPrompt,
    `以下是同一场会议的分段提取结果。请合并去重，并严格输出最终 Markdown 总结，不要输出思考过程。\n\n${partialSummaries
      .map((summary, index) => `### 第 ${index + 1} 段提取\n${summary}`)
      .join('\n\n')}`,
    1024
  );
};

export const releaseLocalLlmModel = async (): Promise<void> => {
  if (!contextPromise) return;
  const context = await contextPromise.catch(() => null);
  contextPromise = null;
  if (context) await context.release();
};
