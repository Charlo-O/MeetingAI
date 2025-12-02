// types.ts

// 1. 用户自定义配置 (保存在本地)
export interface AppSettings {
  // STT (语音转文字)
  sttBaseUrl: string; // 例如: https://api.openai.com/v1
  sttApiKey: string;
  sttModel: string;   // 例如: whisper-1

  // LLM (总结)
  llmBaseUrl: string; // 例如: https://api.deepseek.com/v1
  llmApiKey: string;
  llmModel: string;   // 例如: gpt-4o, deepseek-chat
  systemPrompt: string; // 用户自定义提示词

  // TTS (朗读) - 可选
  ttsBaseUrl: string;
  ttsApiKey: string;
  ttsModel: string;   // 例如: tts-1
  ttsVoice: string;   // 例如: alloy, echo, fable, onyx, nova, shimmer
}

// 2. 单条会议记录
export interface MeetingNote {
  id: string;
  title: string;
  createdAt: number;
  audioUri: string;      // 本地录音文件路径
  duration: number;      // 时长(秒)
  transcript: string;    // STT 转出的原文
  summary: string;       // LLM 总结出的 Markdown
  status: 'recorded' | 'transcribing' | 'summarizing' | 'done' | 'error';
  errorMessage?: string;
}

// 默认设置
export const defaultSettings: AppSettings = {
  sttBaseUrl: 'https://api.openai.com/v1',
  sttApiKey: '',
  sttModel: 'whisper-1',
  
  llmBaseUrl: 'https://api.openai.com/v1',
  llmApiKey: '',
  llmModel: 'gpt-4o-mini',
  systemPrompt: '你是一个专业的会议助手。请对以下会议内容进行总结，包括：\n1. 会议要点\n2. 讨论的主要议题\n3. 做出的决定\n4. 待办事项（如有）\n\n请使用 Markdown 格式输出。',
  
  ttsBaseUrl: 'https://api.openai.com/v1',
  ttsApiKey: '',
  ttsModel: 'tts-1',
  ttsVoice: 'alloy',
};
