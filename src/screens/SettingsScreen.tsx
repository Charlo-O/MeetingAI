import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, Platform, TouchableOpacity } from 'react-native';
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

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { settings, updateSettings, resetSettings } = useSettingsStore();

  // 本地状态用于编辑
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSttKey, setShowSttKey] = useState(false);
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [showTtsKey, setShowTtsKey] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    Alert.alert('保存成功', '设置已保存，修改将立即生效');
    navigation.goBack();
  };

  const handleBack = () => {
    // 自动保存设置
    updateSettings(localSettings);
    navigation.goBack();
  };

  const handleReset = () => {
    Alert.alert(
      '重置设置',
      '确定要恢复默认设置吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            resetSettings();
            setLocalSettings(defaultSettings);
          },
        },
      ]
    );
  };

  const updateField = (field: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={handleBack} color={skeuColors.textPrimary} />
        <Appbar.Content title="设置" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="content-save" onPress={handleSave} color={skeuColors.primary} />
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
                  sttBaseUrl: provider === 'assemblyai'
                    ? '' // AssemblyAI 不需要 Base URL
                    : 'https://api.openai.com/v1',
                  sttModel: provider === 'assemblyai' ? '' : 'whisper-1',
                }));
              }}
              buttons={[
                { value: 'whisper', label: 'Whisper' },
                { value: 'assemblyai', label: 'AssemblyAI' },
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
              : '支持 OpenAI Whisper 及兼容接口。推荐：Groq (api.groq.com/openai/v1)'
            }
          </HelperText>

          {/* Whisper 才显示 Base URL */}
          {localSettings.sttProvider !== 'assemblyai' && (
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

          <View style={styles.inputWrapper}>
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
          </View>

          {/* Whisper 才显示模型名称 */}
          {localSettings.sttProvider !== 'assemblyai' && (
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
          <Title style={styles.cardTitle}>大语言模型 (LLM)</Title>
          <HelperText type="info" style={styles.helperText}>
            支持 OpenAI、DeepSeek、Groq 等兼容接口
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
            用于朗读总结内容
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    ...skeuStyles.neumorphicCard,
    padding: 16,
    marginBottom: 24,
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
    borderRadius: 12, // Reduced for inner elements
    overflow: 'hidden',
  },
  segmentedButtons: {
    backgroundColor: skeuColors.backgroundDark,
  },
  inputWrapper: {
    marginTop: 16,
    ...skeuStyles.neumorphicInset,
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
    ...skeuStyles.neumorphicButton,
    backgroundColor: skeuColors.background, // Keep it neutral/light
    marginBottom: 32,
  },
  resetButtonText: {
    color: skeuColors.recordRed, // Red for destructive/reset
    fontSize: 16,
    fontWeight: '600',
  },
});
