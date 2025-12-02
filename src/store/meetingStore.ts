import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { MeetingNote } from '../types';

// 使用 Expo Crypto API 生成安全的 UUID
const generateId = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  // 设置版本号 (4) 和变体 (10xx)
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;
  
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return [
    hex.substr(0, 8),
    hex.substr(8, 4),
    hex.substr(12, 4),
    hex.substr(16, 4),
    hex.substr(20, 12)
  ].join('-');
};

interface MeetingStore {
  meetings: MeetingNote[];
  addMeeting: (meeting: Omit<MeetingNote, 'id' | 'createdAt' | 'status' | 'transcript' | 'summary'>) => Promise<string>;
  updateMeeting: (id: string, partial: Partial<MeetingNote>) => void;
  deleteMeeting: (id: string) => void;
  getMeeting: (id: string) => MeetingNote | undefined;
}

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetings: [],
      
      addMeeting: async (meeting) => {
        const id = await generateId();
        const newMeeting: MeetingNote = {
          ...meeting,
          id,
          createdAt: Date.now(),
          status: 'recorded',
          transcript: '',
          summary: '',
        };
        set((state) => ({
          meetings: [newMeeting, ...state.meetings],
        }));
        return id;
      },
      
      updateMeeting: (id, partial) => {
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === id ? { ...m, ...partial } : m
          ),
        }));
      },
      
      deleteMeeting: (id) => {
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
        }));
      },
      
      getMeeting: (id) => {
        return get().meetings.find((m) => m.id === id);
      },
    }),
    {
      name: 'meeting-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
