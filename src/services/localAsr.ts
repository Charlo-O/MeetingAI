/**
 * Platform-neutral contract for the on-device Confucius4-R2T2 recognizer.
 * Metro replaces this module with localAsr.native.ts or localAsr.web.ts.
 */
export type LocalAsrProgress = (progress: number, stage: 'model' | 'mmproj') => void;

export type LocalAsrOptions = {
  onProgress?: LocalAsrProgress;
};

export const ensureLocalAsrModel = async (_options: LocalAsrOptions = {}): Promise<void> => {
  throw new Error('本地 ASR 只支持 iOS 和 Android 原生构建');
};

export const transcribeAudioLocal = async (
  _audioUri: string,
  _options: LocalAsrOptions = {}
): Promise<string> => {
  throw new Error('本地 ASR 只支持 iOS 和 Android 原生构建');
};

export const releaseLocalAsrModel = async (): Promise<void> => undefined;
