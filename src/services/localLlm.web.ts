import type { LocalLlmOptions } from './localLlm';

export const ensureLocalLlmModel = async (_options: LocalLlmOptions = {}): Promise<void> => {
  throw new Error('本地 LLM 需要 iOS 或 Android 原生构建，Expo Web 不支持 llama.rn');
};

export const summarizeTextLocal = async (
  _text: string,
  _systemPrompt: string,
  _options: LocalLlmOptions = {}
): Promise<string> => {
  throw new Error('本地 LLM 需要 iOS 或 Android 原生构建，Expo Web 不支持 llama.rn');
};

export const releaseLocalLlmModel = async (): Promise<void> => undefined;
