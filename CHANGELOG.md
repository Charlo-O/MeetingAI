# 更新日志

## 2026-01-14

### 新增功能
- ✅ **AssemblyAI 集成**: 替换阿里云 FunASR，提供每月 5 小时免费语音转写
  - 直接上传二进制文件，完美兼容 React Native
  - 支持中文识别 (`language_code: 'zh'`)
  - 简化配置：仅需 API Key，无需 Base URL 和 Model
  - 获取免费 API Key: https://www.assemblyai.com/app/signup
  
### 改进
- ✅ **设置界面优化**
  - 自动保存：点击返回键自动保存设置
  - 按钮布局调整：保存按钮移至右上角，恢复默认移至底部
  - 智能提示：根据选择的服务提供商显示相应提示
  - Groq 模型提示：显示可用的 Whisper 模型列表

### 技术改进
- ✅ 解决 React Native FormData 兼容性问题
- ✅ 使用 ArrayBuffer 直接上传，避免 Blob 创建错误
- ✅ 详细的错误日志，便于问题排查
- ✅ 三步式转写流程：上传 → 提交 → 轮询

### 代码变更
修改的文件：
- `src/types.ts` - 更新 SttProvider 类型 (`'whisper' | 'assemblyai'`)
- `src/services/aiService.ts` - 实现 AssemblyAI 完整转写流程
- `src/screens/SettingsScreen.tsx` - UI 优化和智能提示
- `src/services/audioService.ts` - 改进音频处理
- `src/services/index.ts` - 更新导出
- `src/screens/RecordScreen.tsx` - 兼容新的 STT provider
  
### 移除功能
- ❌ 移除阿里云 FunASR（不支持本地文件直接上传）
- ❌ 移除相关常量和函数

### Bug 修复
- 🐛 修复 React Native 不支持从 ArrayBuffer 创建 Blob 的问题
- 🐛 修复 Groq Whisper API 在 React Native 中的兼容性问题（使用 AssemblyAI 作为替代方案）

### 已知问题
- ⚠️ Groq Whisper API 在 React Native 中存在 FormData 兼容性问题，建议使用 AssemblyAI 或 OpenAI Whisper

## 支持的 STT 服务对比

| 服务 | 免费额度 | React Native 兼容 | 配置复杂度 | 中文支持 |
|------|----------|-------------------|------------|----------|
| AssemblyAI | ✅ 5小时/月 | ✅ 完美 | ⭐ 简单 | ✅ 支持 |
| OpenAI Whisper | ❌ 付费 | ✅ 良好 | ⭐⭐ 中等 | ✅ 支持 |
| Groq Whisper | ❌ 有限额 | ❌ 兼容性问题 | ⭐⭐ 中等 | ✅ 支持 |
