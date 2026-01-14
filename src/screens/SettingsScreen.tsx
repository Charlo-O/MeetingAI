import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
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
} from 'react-native-paper';
import { useSettingsStore } from '../store';
import { defaultSettings, SttProvider } from '../types';

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
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="设置" />
        <Appbar.Action icon="content-save" onPress={handleSave} />
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* STT 配置 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>语音转文字 (STT)</Title>

            {/* Provider 选择 */}
            <HelperText type="info" style={styles.providerHelperText}>
              选择语音识别服务
            </HelperText>
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
            />

            <HelperText type="info">
              {localSettings.sttProvider === 'assemblyai'
                ? '✅ AssemblyAI 免费额度: 每月 5 小时。仅需 API Key，无需设置 Base URL'
                : '支持 OpenAI Whisper 及兼容接口。推荐：Groq (api.groq.com/openai/v1)'
              }
            </HelperText>

            {/* Whisper 才显示 Base URL */}
            {localSettings.sttProvider !== 'assemblyai' && (
              <TextInput
                label="Base URL"
                value={localSettings.sttBaseUrl}
                onChangeText={(v) => updateField('sttBaseUrl', v)}
                mode="outlined"
                style={styles.input}
                placeholder="https://api.openai.com/v1"
              />
            )}

            <TextInput
              label="API Key"
              value={localSettings.sttApiKey}
              onChangeText={(v) => updateField('sttApiKey', v)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showSttKey}
              placeholder={localSettings.sttProvider === 'assemblyai' ? '获取: assemblyai.com/app/signup' : ''}
              right={
                <TextInput.Icon
                  icon={showSttKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowSttKey(!showSttKey)}
                />
              }
            />

            {/* Whisper 才显示模型名称 */}
            {localSettings.sttProvider !== 'assemblyai' && (
              <>
                <TextInput
                  label="模型名称"
                  value={localSettings.sttModel}
                  onChangeText={(v) => updateField('sttModel', v)}
                  mode="outlined"
                  style={styles.input}
                  placeholder="whisper-1"
                />
                {localSettings.sttBaseUrl.includes('groq.com') && (
                  <HelperText type="info" visible={true}>
                    💡 Groq 可用模型:{'\n'}
                    • whisper-large-v3-turbo (快速){'\n'}
                    • whisper-large-v3 (准确){'\n'}
                    • distil-whisper-large-v3-en (仅英文,最快)
                  </HelperText>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* LLM 配置 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>大语言模型 (LLM)</Title>
            <HelperText type="info">
              支持 OpenAI、DeepSeek、Groq 等兼容接口
            </HelperText>

            <TextInput
              label="Base URL"
              value={localSettings.llmBaseUrl}
              onChangeText={(v) => updateField('llmBaseUrl', v)}
              mode="outlined"
              style={styles.input}
              placeholder="https://api.openai.com/v1"
            />

            <TextInput
              label="API Key"
              value={localSettings.llmApiKey}
              onChangeText={(v) => updateField('llmApiKey', v)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showLlmKey}
              right={
                <TextInput.Icon
                  icon={showLlmKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowLlmKey(!showLlmKey)}
                />
              }
            />

            <TextInput
              label="模型名称"
              value={localSettings.llmModel}
              onChangeText={(v) => updateField('llmModel', v)}
              mode="outlined"
              style={styles.input}
              placeholder="gpt-4o-mini"
            />

            <TextInput
              label="系统提示词"
              value={localSettings.systemPrompt}
              onChangeText={(v) => updateField('systemPrompt', v)}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
            />
          </Card.Content>
        </Card>

        {/* TTS 配置 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>语音合成 (TTS) - 可选</Title>
            <HelperText type="info">
              用于朗读总结内容
            </HelperText>

            <TextInput
              label="Base URL"
              value={localSettings.ttsBaseUrl}
              onChangeText={(v) => updateField('ttsBaseUrl', v)}
              mode="outlined"
              style={styles.input}
              placeholder="https://api.openai.com/v1"
            />

            <TextInput
              label="API Key"
              value={localSettings.ttsApiKey}
              onChangeText={(v) => updateField('ttsApiKey', v)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showTtsKey}
              right={
                <TextInput.Icon
                  icon={showTtsKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowTtsKey(!showTtsKey)}
                />
              }
            />

            <TextInput
              label="模型名称"
              value={localSettings.ttsModel}
              onChangeText={(v) => updateField('ttsModel', v)}
              mode="outlined"
              style={styles.input}
              placeholder="tts-1"
            />

            <TextInput
              label="语音"
              value={localSettings.ttsVoice}
              onChangeText={(v) => updateField('ttsVoice', v)}
              mode="outlined"
              style={styles.input}
              placeholder="alloy, echo, fable, onyx, nova, shimmer"
            />
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={handleReset}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          恢复默认设置
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 8,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  providerHelperText: {
    marginBottom: 4,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
});
