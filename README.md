# MeetingAI - 会议录音助手

基于 React Native + Expo 的会议录音应用，支持 OpenAI 兼容接口进行语音转文字和智能总结。

<img width="7954" height="2725" alt="Frame 5" src="https://github.com/user-attachments/assets/269a7631-e599-49f8-9f3e-75e687e1d7f5" />


## 功能特性

- **录音功能**: 使用 expo-av 录制高质量 m4a 格式音频
- **语音转文字 (STT)**: 支持 OpenAI Whisper、AssemblyAI，以及基于 llama.rn 的本地 Confucius4-R2T2
- **智能总结 (LLM)**: 可选，支持 OpenAI、DeepSeek、Groq 等兼容接口
- **语音合成 (TTS)**: 可选功能，朗读总结内容
- **本地存储**: 使用 AsyncStorage 持久化会议记录和设置
- **Markdown 渲染**: 美观展示 AI 生成的总结

## 技术栈

- **框架**: Expo SDK 54+
- **语言**: TypeScript
- **状态管理**: Zustand + AsyncStorage
- **UI 库**: React Native Paper (Material Design 3) + Light Skeuomorphism (轻拟物风格)
- **导航**: React Navigation
- **录音/播放**: expo-av
- **本地推理**: llama.rn + GGUF/mmproj（iOS/Android 原生）
- **音频预处理**: react-native-audio-api（本地转为 16kHz 单声道 WAV）
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

### Landing 与 App

Landing 是独立的静态站点，入口和资源都在 `landing/`，可以直接部署到静态托管服务。它不参与 Expo 打包，也不依赖 React Native。

App 只包含会议录音、转录、总结和设置等业务页面。Expo Web 入口默认进入 App 工作区（`/app`），移动端直接进入首页。

### 3. 配置 API

首次使用需要在设置页面配置：

- **STT (语音转文字)**
  - Base URL: `https://api.openai.com/v1`
  - API Key: 你的 OpenAI API Key
  - Model: `whisper-1`

- **LLM (大语言模型)** - 可选，留空时仍可完成转录
  - Base URL: `https://api.openai.com/v1` 或其他兼容接口
  - API Key: 你的 API Key（可留空）
  - Model: `gpt-4o-mini` 或其他模型

- **TTS (语音合成)** - 可选
  - Base URL: `https://api.openai.com/v1`
  - API Key: 你的 API Key
  - Model: `tts-1`
  - Voice: `alloy`

- **本地 R2T2（无需 STT API Key）**
  - 在设置中选择“本地 R2T2”。
  - 点击“下载并加载本地模型”，应用会从 ModelScope 下载 Q8_0 主模型和 mmproj，约占 2.2GB。
  - 模型和音频都在手机本地处理；录音不会上传。
  - 该能力需要 `npx expo run:android` 或 EAS 原生构建，Expo Web 不支持 llama.rn。

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
landing/
├── index.html       # 独立 Landing 页面
├── styles.css       # Landing 样式
├── script.js        # Landing 交互与多语言
└── assets/          # Landing 专用图片资源

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
│   ├── audioService.ts     # 录音服务
│   ├── localAsr.native.ts  # llama.rn + R2T2 本地 ASR
│   ├── localAsr.web.ts     # Web 端能力提示
│   └── localAsr.ts         # 平台无关接口
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

## 品牌手册

- `BRAND_GUIDE.md`

## 注意事项


1. **录音权限**: 首次录音需要授权麦克风权限
2. **API 超时**: 长音频转录可能需要较长时间，请耐心等待
3. **文件格式**: 录音使用 m4a 格式，兼容 OpenAI Whisper
4. **网络要求**: 需要稳定的网络连接调用 API

## 构建发布

### 方法 1: EAS Build 云端构建（推荐）

```bash
# 登录 Expo 账号
npx eas login

# 构建 Android APK
npx eas build --platform android --profile preview

# 构建 iOS (需要 Apple Developer 账号)
npx eas build --platform ios --profile preview
```

**优点**：
- ✅ 无需配置本地环境
- ✅ 自动处理所有依赖
- ✅ 免费账户每月 30 次构建
- ⏱️ 构建时间约 10-15 分钟

### 方法 2: Android Studio 本地构建

```bash
# 1. 安装必要依赖
npx expo install expo-system-ui

# 2. 生成原生项目
npx expo prebuild

# 3. 使用 Android Studio 打开 android 文件夹

# 4. 或使用命令行构建
cd android
.\gradlew.bat assembleRelease  # Windows
./gradlew assembleRelease       # macOS/Linux

# 5. APK 位于
# android/app/build/outputs/apk/release/app-release.apk
```

**前提条件**：
- 安装 Android Studio
- 配置 Android SDK
- 安装 JDK 17

详细教程请查看项目中的 `build_apk_guide.md`

## License

MIT
