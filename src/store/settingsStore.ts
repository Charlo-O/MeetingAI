import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, defaultSettings } from '../types';

interface SettingsStore {
  settings: AppSettings;
  isConfigured: () => boolean;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      
      // 录音只依赖 STT；LLM 总结和 TTS 都是可选能力
      isConfigured: () => {
        const { settings } = get();
        return settings.sttProvider === 'local_r2t2' || !!settings.sttApiKey?.trim();
      },
      
      updateSettings: (partial) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }));
      },
      
      resetSettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Keep settings added in later releases available to existing installs.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SettingsStore>),
        settings: {
          ...current.settings,
          ...((persisted as Partial<SettingsStore>)?.settings || {}),
        },
      }),
    }
  )
);
