# MeetingAI - 会议录音助手

基于 React Native + Expo 的会议录音应用，支持 OpenAI 兼容接口进行语音转文字和智能总结。

<img width="7954" height="2725" alt="Frame 5" src="https://github.com/user-attachments/assets/269a7631-e599-49f8-9f3e-75e687e1d7f5" />


## 功能特性

- **录音功能**: 使用 expo-av 录制高质量 m4a 格式音频
- **语音转文字 (STT)**: 支持 OpenAI Whisper 及兼容接口
- **智能总结 (LLM)**: 支持 OpenAI、DeepSeek、Groq 等兼容接口
- **语音合成 (TTS)**: 可选功能，朗读总结内容
- **本地存储**: 使用 AsyncStorage 持久化会议记录和设置
- **Markdown 渲染**: 美观展示 AI 生成的总结

## 技术栈

- **框架**: Expo SDK 54+
- **语言**: TypeScript
- **状态管理**: Zustand + AsyncStorage
- **UI 库**: React Native Paper (Material Design 3)
- **导航**: React Navigation
- **录音/播放**: expo-av
- **网络请求**: axios
- **Markdown**: react-native-markdown-display

## 快速开始

### 1. 安装依赖

```bash
cd MeetingAI
npm install
```

### 2. 启动开发服务器

```bash
# Web 预览
npx expo start --web

# Android
npx expo start --android

# iOS (需要 macOS)
npx expo start --ios
```

### 3. 配置 API

首次使用需要在设置页面配置：

- **STT (语音转文字)**
  - Base URL: `https://api.openai.com/v1`
  - API Key: 你的 OpenAI API Key
  - Model: `whisper-1`

- **LLM (大语言模型)**
  - Base URL: `https://api.openai.com/v1` 或其他兼容接口
  - API Key: 你的 API Key
  - Model: `gpt-4o-mini` 或其他模型

- **TTS (语音合成)** - 可选
  - Base URL: `https://api.openai.com/v1`
  - API Key: 你的 API Key
  - Model: `tts-1`
  - Voice: `alloy`

## 兼容的 API 服务

### STT (Whisper)
- OpenAI: `https://api.openai.com/v1`
- Groq: `https://api.groq.com/openai/v1`

### LLM
- OpenAI: `https://api.openai.com/v1`
- DeepSeek: `https://api.deepseek.com/v1`
- Groq: `https://api.groq.com/openai/v1`
- 其他 OpenAI 兼容接口

## 项目结构

```
src/
├── components/     # 通用组件
├── screens/        # 页面
│   ├── HomeScreen.tsx      # 首页 - 会议列表
│   ├── RecordScreen.tsx    # 录音页
│   ├── DetailScreen.tsx    # 详情页 - 总结/原文
│   └── SettingsScreen.tsx  # 设置页
├── store/          # Zustand 状态管理
│   ├── settingsStore.ts    # 设置存储
│   └── meetingStore.ts     # 会议记录存储
├── services/       # API 服务
│   ├── aiService.ts        # STT/LLM/TTS 调用
│   └── audioService.ts     # 录音服务
├── utils/          # 工具函数
├── navigation/     # 导航配置
└── types.ts        # TypeScript 类型定义
```

## 使用流程

1. **配置 API**: 首次使用点击右上角设置图标，配置 API Key
2. **开始录音**: 点击首页底部麦克风按钮开始录音
3. **停止录音**: 录音完成后点击停止，选择立即处理或稍后处理
4. **查看结果**: 在详情页查看 AI 生成的总结和原文
5. **编辑原文**: 可以修改识别错误的文字，重新生成总结

## 注意事项

1. **录音权限**: 首次录音需要授权麦克风权限
2. **API 超时**: 长音频转录可能需要较长时间，请耐心等待
3. **文件格式**: 录音使用 m4a 格式，兼容 OpenAI Whisper
4. **网络要求**: 需要稳定的网络连接调用 API

## 构建发布

```bash
# 构建 Android APK
npx expo build:android

# 构建 iOS (需要 Apple Developer 账号)
npx expo build:ios

# 使用 EAS Build
npx eas build --platform android
npx eas build --platform ios
```

## License

MIT
