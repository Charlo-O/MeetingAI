/**
 * Platform-neutral contract for the on-device Qwen3.8 summarizer.
 * Metro replaces this module with localLlm.native.ts or localLlm.web.ts.
 */
export type LocalLlmProgress = (progress: number, stage: 'model') => void;

export type LocalLlmOptions = {
  onProgress?: LocalLlmProgress;
};

export const ensureLocalLlmModel = async (_options: LocalLlmOptions = {}): Promise<void> => {
  throw new Error('本地 LLM 只支持 iOS 和 Android 原生构建');
};

export const summarizeTextLocal = async (
  _text: string,
  _systemPrompt: string,
  _options: LocalLlmOptions = {}
): Promise<string> => {
  throw new Error('本地 LLM 只支持 iOS 和 Android 原生构建');
};

export const releaseLocalLlmModel = async (): Promise<void> => undefined;
