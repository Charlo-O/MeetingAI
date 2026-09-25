import type { LocalAsrOptions } from './localAsr';

export const ensureLocalAsrModel = async (_options: LocalAsrOptions = {}): Promise<void> => {
  throw new Error('本地 ASR 需要 iOS 或 Android 原生构建，Expo Web 不支持 llama.rn');
};

export const transcribeAudioLocal = async (
  _audioUri: string,
  _options: LocalAsrOptions = {}
): Promise<string> => {
  throw new Error('本地 ASR 需要 iOS 或 Android 原生构建，Expo Web 不支持 llama.rn');
};

export const releaseLocalAsrModel = async (): Promise<void> => undefined;
