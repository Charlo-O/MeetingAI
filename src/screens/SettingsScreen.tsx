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
} from 'react-native-paper';
import { useSettingsStore } from '../store';
import { defaultSettings } from '../types';

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
    Alert.alert('保存成功', '设置已保存');
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
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="设置" />
        <Appbar.Action icon="refresh" onPress={handleReset} />
      </Appbar.Header>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* STT 配置 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>语音转文字 (STT)</Title>
            <HelperText type="info">
              支持 OpenAI Whisper 兼容接口
            </HelperText>
            
            <TextInput
              label="Base URL"
              value={localSettings.sttBaseUrl}
              onChangeText={(v) => updateField('sttBaseUrl', v)}
              mode="outlined"
              style={styles.input}
              placeholder="https://api.openai.com/v1"
            />
            
            <TextInput
              label="API Key"
              value={localSettings.sttApiKey}
              onChangeText={(v) => updateField('sttApiKey', v)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showSttKey}
              right={
                <TextInput.Icon
                  icon={showSttKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowSttKey(!showSttKey)}
                />
              }
            />
            
            <TextInput
              label="模型名称"
              value={localSettings.sttModel}
              onChangeText={(v) => updateField('sttModel', v)}
              mode="outlined"
              style={styles.input}
              placeholder="whisper-1"
            />
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
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          保存设置
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
});
