import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Appbar,
  TextInput,
  Button,
  Card,
  Title,
  Divider,
  useTheme,
  HelperText,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import { useSettingsStore } from '../store';
import { defaultSettings, SttProvider } from '../types';
import { skeuColors, skeuStyles } from '../utils';
import { SkeuDialog } from '../components';
import { ensureLocalAsrModel } from '../services/localAsr';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { settings, updateSettings, resetSettings } = useSettingsStore();

  // 本地状态用于编辑
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSttKey, setShowSttKey] = useState(false);
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [showTtsKey, setShowTtsKey] = useState(false);
  const [localModelStatus, setLocalModelStatus] = useState('');

  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    setSaveSuccessVisible(true);
  };

  const handleBack = () => {
    // 自动保存设置
    updateSettings(localSettings);
    navigation.goBack();
  };

  const handleReset = () => {
    setResetDialogVisible(true);
  };

  const handlePrepareLocalModel = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('暂不支持', '本地 ASR 需要 iOS 或 Android 原生构建。');
      return;
    }
    try {
      setLocalModelStatus('正在下载或加载模型…');
      await ensureLocalAsrModel({
        onProgress: (progress, stage) => {
          const name = stage === 'model' ? '主模型' : '音频投影';
          setLocalModelStatus(`${name} ${(progress * 100).toFixed(0)}%`);
        },
      });
      setLocalModelStatus('模型已就绪，可离线转写');
    } catch (error: any) {
      setLocalModelStatus('');
      Alert.alert('本地 ASR 初始化失败', error?.message || '请检查存储空间后重试');
    }
  };

  const updateField = (field: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        {/* Skeuomorphic Back Button */}
        <TouchableOpacity style={styles.appBarButton} onPress={handleBack} activeOpacity={0.9}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={skeuColors.textPrimary} />
        </TouchableOpacity>
        <Appbar.Content title="设置" titleStyle={styles.appbarTitle} />
        {/* Skeuomorphic Save Button */}
        <TouchableOpacity style={styles.appBarButton} onPress={handleSave} activeOpacity={0.9}>
          <MaterialCommunityIcons name="content-save-outline" size={22} color={skeuColors.primary} />
        </TouchableOpacity>
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* STT 配置 */}
        <View style={styles.card}>
          <Title style={styles.cardTitle}>语音转文字 (STT)</Title>

          {/* Provider 选择 */}
          <HelperText type="info" style={styles.providerHelperText}>
            选择语音识别服务
          </HelperText>
          <View style={styles.segmentedContainer}>
            <SegmentedButtons
              value={localSettings.sttProvider || 'whisper'}
              onValueChange={(value) => {
                const provider = value as SttProvider;
                setLocalSettings((prev) => ({
                  ...prev,
                  sttProvider: provider,
                  // 切换时自动设置默认值
                  sttBaseUrl: provider === 'assemblyai' || provider === 'local_r2t2'
                    ? '' // 本地和 AssemblyAI 都不需要 Base URL
                    : 'https://api.openai.com/v1',
                  sttModel: provider === 'assemblyai'
                    ? ''
                    : provider === 'local_r2t2'
                      ? 'Confucius4-R2T2-Q8_0'
                      : 'whisper-1',
                }));
              }}
              buttons={[
                { value: 'whisper', label: 'Whisper' },
                { value: 'assemblyai', label: 'AssemblyAI' },
                { value: 'local_r2t2', label: '本地 R2T2' },
              ]}
              style={styles.segmentedButtons}
              theme={{
                colors: {
                  secondaryContainer: skeuColors.primary,
                  onSecondaryContainer: '#FFFFFF',
                },
              }}
            />
          </View>

          <HelperText type="info" style={styles.helperText}>
            {localSettings.sttProvider === 'assemblyai'
              ? '✅ AssemblyAI 免费额度: 每月 5 小时。仅需 API Key，无需设置 Base URL'
              : localSettings.sttProvider === 'local_r2t2'
                ? '✅ Confucius4-R2T2 + llama.rn：模型下载到手机后离线运行，不需要 API Key。首次需要约 2.2GB 空间。'
              : '支持 OpenAI Whisper 及兼容接口。推荐：Groq (api.groq.com/openai/v1)'
            }
          </HelperText>

          {localSettings.sttProvider === 'local_r2t2' && (
            <View style={styles.localAsrBox}>
              <Text style={styles.localAsrText}>
                使用 Q8_0 主模型和 mmproj 音频投影文件。录音会在手机本地转换为 16kHz WAV 后交给 llama.rn。
              </Text>
              <Button
                mode="contained"
                onPress={handlePrepareLocalModel}
                style={styles.localAsrButton}
                buttonColor={skeuColors.primary}
                textColor="#FFFFFF"
              >
                下载并加载本地模型
              </Button>
              {!!localModelStatus && (
                <HelperText type="info" style={styles.helperText}>
                  {localModelStatus}
                </HelperText>
              )}
            </View>
          )}

          {/* Whisper 才显示 Base URL */}
          {localSettings.sttProvider !== 'assemblyai' && localSettings.sttProvider !== 'local_r2t2' && (
            <View style={styles.inputWrapper}>
              <TextInput
                label="Base URL"
                value={localSettings.sttBaseUrl}
                onChangeText={(v) => updateField('sttBaseUrl', v)}
                mode="flat"
                style={styles.input}
                placeholder="https://api.openai.com/v1"
                underlineColor="transparent"
                activeUnderlineColor={skeuColors.primary}
                textColor={skeuColors.textPrimary}
                placeholderTextColor={skeuColors.textMuted}
              />
            </View>
          )}

          {localSettings.sttProvider !== 'local_r2t2' && <View style={styles.inputWrapper}>
            <TextInput
              label="API Key"
              value={localSettings.sttApiKey}
              onChangeText={(v) => updateField('sttApiKey', v)}
              mode="flat"
              style={styles.input}
              secureTextEntry={!showSttKey}
              placeholder={localSettings.sttProvider === 'assemblyai' ? '获取: assemblyai.com/app/signup' : ''}
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
              right={
                <TextInput.Icon
                  icon={showSttKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowSttKey(!showSttKey)}
                  color={skeuColors.textSecondary}
                />
              }
            />
          </View>}

          {/* Whisper 才显示模型名称 */}
          {localSettings.sttProvider === 'whisper' && (
            <>
              <View style={styles.inputWrapper}>
                <TextInput
                  label="模型名称"
                  value={localSettings.sttModel}
                  onChangeText={(v) => updateField('sttModel', v)}
                  mode="flat"
                  style={styles.input}
                  placeholder="whisper-1"
                  underlineColor="transparent"
                  activeUnderlineColor={skeuColors.primary}
                  textColor={skeuColors.textPrimary}
                  placeholderTextColor={skeuColors.textMuted}
                />
              </View>
              {localSettings.sttBaseUrl.includes('groq.com') && (
                <HelperText type="info" visible={true} style={styles.helperText}>
                  💡 Groq 可用模型:{'\n'}
                  • whisper-large-v3-turbo (快速){'\n'}
                  • whisper-large-v3 (准确){'\n'}
                  • distil-whisper-large-v3-en (仅英文,最快)
                </HelperText>
              )}
            </>
          )}
        </View>

        {/* LLM 配置 */}
        <View style={styles.card}>
          <Title style={styles.cardTitle}>大语言模型 (LLM) - 可选</Title>
          <HelperText type="info" style={styles.helperText}>
            用于生成会议总结；留空时仍可完成本地转录。支持 OpenAI、DeepSeek、Groq 等兼容接口
          </HelperText>

          <View style={styles.inputWrapper}>
            <TextInput
              label="Base URL"
              value={localSettings.llmBaseUrl}
              onChangeText={(v) => updateField('llmBaseUrl', v)}
              mode="flat"
              style={styles.input}
              placeholder="https://api.openai.com/v1"
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              label="API Key"
              value={localSettings.llmApiKey}
              onChangeText={(v) => updateField('llmApiKey', v)}
              mode="flat"
              style={styles.input}
              secureTextEntry={!showLlmKey}
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
              right={
                <TextInput.Icon
                  icon={showLlmKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowLlmKey(!showLlmKey)}
                  color={skeuColors.textSecondary}
                />
              }
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              label="模型名称"
              value={localSettings.llmModel}
              onChangeText={(v) => updateField('llmModel', v)}
              mode="flat"
              style={styles.input}
              placeholder="gpt-4o-mini"
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              label="系统提示词"
              value={localSettings.systemPrompt}
              onChangeText={(v) => updateField('systemPrompt', v)}
              mode="flat"
              style={[styles.input, styles.multilineInput]}
              multiline
              numberOfLines={4}
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
            />
          </View>
        </View>

        {/* TTS 配置 */}
        <View style={styles.card}>
          <Title style={styles.cardTitle}>语音合成 (TTS) - 可选</Title>
          <HelperText type="info" style={styles.helperText}>
            用于朗读总结内容；可留空，不影响录音和转录
          </HelperText>

          <View style={styles.inputWrapper}>
            <TextInput
              label="Base URL"
              value={localSettings.ttsBaseUrl}
              onChangeText={(v) => updateField('ttsBaseUrl', v)}
              mode="flat"
              style={styles.input}
              placeholder="https://api.openai.com/v1"
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              label="API Key"
              value={localSettings.ttsApiKey}
              onChangeText={(v) => updateField('ttsApiKey', v)}
              mode="flat"
              style={styles.input}
              secureTextEntry={!showTtsKey}
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
              right={
                <TextInput.Icon
                  icon={showTtsKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowTtsKey(!showTtsKey)}
                  color={skeuColors.textSecondary}
                />
              }
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              label="模型名称"
              value={localSettings.ttsModel}
              onChangeText={(v) => updateField('ttsModel', v)}
              mode="flat"
              style={styles.input}
              placeholder="tts-1"
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              label="语音"
              value={localSettings.ttsVoice}
              onChangeText={(v) => updateField('ttsVoice', v)}
              mode="flat"
              style={styles.input}
              placeholder="alloy, echo, fable, onyx, nova, shimmer"
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              placeholderTextColor={skeuColors.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={styles.resetButtonText}>恢复默认设置</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Success Dialog */}
      <SkeuDialog
        visible={saveSuccessVisible}
        title="保存成功"
        message="设置已保存，修改将立即生效"
        buttons={[
          {
            text: 'OK',
            onPress: () => {
              setSaveSuccessVisible(false);
              navigation.goBack();
            },
          },
        ]}
        onDismiss={() => setSaveSuccessVisible(false)}
      />

      {/* Reset Confirmation Dialog */}
      <SkeuDialog
        visible={resetDialogVisible}
        title="重置设置"
        message="确定要恢复默认设置吗？"
        buttons={[
          {
            text: '取消',
            style: 'cancel',
            onPress: () => setResetDialogVisible(false),
          },
          {
            text: '确定',
            style: 'destructive',
            onPress: () => {
              resetSettings();
              setLocalSettings(defaultSettings);
              setResetDialogVisible(false);
            },
          },
        ]}
        onDismiss={() => setResetDialogVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: skeuColors.background,
  },
  appbar: {
    backgroundColor: skeuColors.background,
    elevation: 0,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        borderBottomWidth: 0,
      }
    }),
  },
  appbarTitle: {
    color: skeuColors.textPrimary,
    fontWeight: '600',
    fontSize: 18,
  },
  appBarButton: {
    width: 40,
    height: 40,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...skeuStyles.neumorphicCard, // Convex style
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    ...skeuStyles.neumorphicCard,
    padding: 24,
    marginBottom: 24,
    backgroundColor: skeuColors.background,
  },
  cardTitle: {
    color: skeuColors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 18,
  },
  helperText: {
    color: skeuColors.textSecondary,
    marginBottom: 8,
  },
  providerHelperText: {
    marginBottom: 4,
    color: skeuColors.textSecondary,
    marginLeft: -4,
  },
  segmentedContainer: {
    marginBottom: 16,
    overflow: 'hidden',
    ...skeuStyles.neumorphicCard, // Convex style (raised buttons)
    padding: 4,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  localAsrBox: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
  },
  localAsrText: {
    color: skeuColors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  localAsrButton: {
    borderRadius: 10,
  },
  inputWrapper: {
    marginTop: 16,
    ...skeuStyles.neumorphicInset, // This now looks much better (lighter)
  },
  input: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  multilineInput: {
    minHeight: 100,
  },
  resetButton: {
    marginTop: 16,
    ...skeuStyles.neumorphicCard, // Use Convex for button (not pressed state)
    padding: 18,
    alignItems: 'center',
    marginBottom: 32,
  },
  resetButtonText: {
    color: skeuColors.recordRed,
    fontSize: 16,
    fontWeight: '600',
  },
});
