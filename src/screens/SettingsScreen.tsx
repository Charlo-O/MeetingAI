import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Appbar,
  Button,
  HelperText,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useSettingsStore } from '../store';
import { AppSettings, defaultSettings, LlmProvider, SttProvider } from '../types';
import { skeuColors, skeuStyles } from '../utils';
import { SkeuDialog } from '../components';
import { ensureLocalAsrModel, releaseLocalAsrModel } from '../services/localAsr';
import { ensureLocalLlmModel, releaseLocalLlmModel } from '../services/localLlm';

type SettingsMode = 'stt' | 'llm' | 'recording';

const modeButtons = [
  { value: 'stt', label: '语音识别' },
  { value: 'llm', label: '会议总结' },
  { value: 'recording', label: '录音体验' },
];

const inputTheme = {
  colors: {
    primary: skeuColors.primary,
    onSurfaceVariant: skeuColors.textSecondary,
  },
};

const selectedSegmentShadow = Platform.select({
  ios: {
    shadowColor: skeuColors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 7,
  },
  android: { elevation: 5 },
  web: {
    boxShadow: `4px 5px 10px ${skeuColors.shadowDark}, -4px -5px 10px ${skeuColors.shadowLight}`,
  },
});

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<AppSettings>({
    ...defaultSettings,
    ...settings,
  });
  const [activeMode, setActiveMode] = useState<SettingsMode>('stt');
  const [showSttKey, setShowSttKey] = useState(false);
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [showTtsKey, setShowTtsKey] = useState(false);
  const [localModelStatus, setLocalModelStatus] = useState('');
  const [localLlmStatus, setLocalLlmStatus] = useState('');
  const [isPreparingModel, setIsPreparingModel] = useState(false);
  const [isPreparingLlm, setIsPreparingLlm] = useState(false);
  const [saveStatus, setSaveStatus] = useState('自动保存');
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

  const persistSettings = () => {
    updateSettings(localSettings);
    setSaveStatus('已保存');
  };

  const handleBack = () => {
    updateSettings(localSettings);
    navigation.goBack();
  };

  const updateField = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setLocalSettings((previous) => ({ ...previous, [field]: value }));
    setSaveStatus('待保存');
  };

  const handlePrepareLocalModel = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('暂不支持', '本地 ASR 需要 iOS 或 Android 原生构建。');
      return;
    }
    setIsPreparingModel(true);
    try {
      await releaseLocalLlmModel();
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
    } finally {
      setIsPreparingModel(false);
    }
  };

  const handlePrepareLocalLlmModel = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('暂不支持', '本地 LLM 需要 iOS 或 Android 原生构建。');
      return;
    }
    setIsPreparingLlm(true);
    try {
      await releaseLocalAsrModel();
      setLocalLlmStatus('正在下载或加载 Qwen3.8…');
      await ensureLocalLlmModel({
        onProgress: (progress) => {
          setLocalLlmStatus(`Qwen3.8 ${(progress * 100).toFixed(0)}%`);
        },
      });
      setLocalLlmStatus('Qwen3.8 已就绪，可离线总结');
    } catch (error: any) {
      setLocalLlmStatus('');
      Alert.alert('本地 LLM 初始化失败', error?.message || '请检查存储空间后重试');
    } finally {
      setIsPreparingLlm(false);
    }
  };

  const renderTextInput = (
    label: string,
    field: keyof AppSettings,
    options: Partial<React.ComponentProps<typeof TextInput>> = {}
  ) => (
    <View style={[styles.inputWrapper, styles.inputWrapperRadius]}>
      <TextInput
        label={label}
        value={String(localSettings[field] ?? '')}
        onChangeText={(value) => updateField(field, value as AppSettings[typeof field])}
        mode="flat"
        style={styles.input}
        underlineColor="transparent"
        activeUnderlineColor={skeuColors.primary}
        textColor={skeuColors.textPrimary}
        placeholderTextColor={skeuColors.textMuted}
        theme={inputTheme}
        {...options}
      />
    </View>
  );

  const renderSttMode = () => (
    <View style={styles.modeBody}>
      <Text style={styles.sectionTitle}>语音识别服务</Text>
      <Text style={styles.sectionDescription}>
        选择会议原文的生成方式。使用本地 R2T2 时，音频和模型都留在设备上。
      </Text>
      <SegmentedButtons
        value={localSettings.sttProvider || 'whisper'}
        onValueChange={(value) => {
          const provider = value as SttProvider;
          setLocalSettings((previous) => ({
            ...previous,
            sttProvider: provider,
            sttBaseUrl: provider === 'assemblyai' || provider === 'local_r2t2'
              ? ''
              : 'https://api.openai.com/v1',
            sttModel: provider === 'assemblyai'
              ? ''
              : provider === 'local_r2t2'
                ? 'Confucius4-R2T2-Q8_0'
                : 'whisper-1',
          }));
          setSaveStatus('待保存');
        }}
        buttons={[
          { value: 'local_r2t2', label: '本地 R2T2' },
          { value: 'whisper', label: 'Whisper' },
          { value: 'assemblyai', label: 'AssemblyAI' },
        ].map((button) => ({
          ...button,
          style: localSettings.sttProvider === button.value ? styles.selectedSegmentButton : undefined,
        }))}
        style={styles.segmentedButtons}
        theme={{ colors: { secondaryContainer: skeuColors.primary, onSecondaryContainer: '#FFFFFF' } }}
      />

      <HelperText type="info" style={styles.helperText}>
        {localSettings.sttProvider === 'assemblyai'
          ? 'AssemblyAI 只需要 API Key，无需 Base URL。'
          : localSettings.sttProvider === 'local_r2t2'
            ? '首次需要约 2.2GB 空间；加载后支持离线转写和实时 token 输出。'
            : '支持 OpenAI Whisper 及兼容接口，Groq 可使用 whisper-large-v3-turbo。'}
      </HelperText>

      {localSettings.sttProvider === 'local_r2t2' ? (
        <View style={styles.modelBox}>
          <View style={styles.modelBoxHeader}>
            <View style={styles.statusDot} />
            <Text style={styles.modelBoxTitle}>本地模型</Text>
            <Text style={styles.modelBoxMeta}>约 2.2GB</Text>
          </View>
          <Text style={styles.modelBoxText}>
            音频会先在设备本地转成 16kHz WAV，再交给 llama.rn。转写过程中可逐 token 更新预览。
          </Text>
          <Button
            mode="contained"
            onPress={handlePrepareLocalModel}
            style={styles.modelButton}
            buttonColor={skeuColors.primary}
            textColor="#FFFFFF"
            disabled={isPreparingModel}
          >
            {isPreparingModel ? '正在准备…' : '下载并加载模型'}
          </Button>
          {!!localModelStatus && <Text style={styles.modelStatus}>{localModelStatus}</Text>}
        </View>
      ) : (
        <>
          {localSettings.sttProvider === 'whisper' && renderTextInput('Base URL', 'sttBaseUrl', {
            placeholder: 'https://api.openai.com/v1',
          })}
          {renderTextInput('API Key', 'sttApiKey', {
            secureTextEntry: !showSttKey,
            placeholder: localSettings.sttProvider === 'assemblyai' ? '从 assemblyai.com 获取' : '',
            right: (
              <TextInput.Icon
                icon={showSttKey ? 'eye-off' : 'eye'}
                onPress={() => setShowSttKey((visible) => !visible)}
                color={skeuColors.textSecondary}
              />
            ),
          })}
          {localSettings.sttProvider === 'whisper' && renderTextInput('模型名称', 'sttModel', {
            placeholder: 'whisper-1',
          })}
        </>
      )}
    </View>
  );

  const renderLlmMode = () => (
    <View style={styles.modeBody}>
      <Text style={styles.sectionTitle}>会议总结</Text>
      <Text style={styles.sectionDescription}>
        总结是可选步骤。没有 LLM 配置时，会议仍会保存完整原文。
      </Text>
      <SegmentedButtons
        value={localSettings.llmProvider || 'cloud'}
        onValueChange={(value) => {
          const provider = value as LlmProvider;
          setLocalSettings((previous) => ({
            ...previous,
            llmProvider: provider,
            llmModel: provider === 'local_qwen38' ? 'Qwen3.8-2B-Q5_K_M.gguf' : 'gpt-4o-mini',
          }));
          setSaveStatus('待保存');
        }}
        buttons={[
          { value: 'local_qwen38', label: '本地 Qwen3.8' },
          { value: 'cloud', label: '云端 API' },
        ].map((button) => ({
          ...button,
          style: localSettings.llmProvider === button.value ? styles.selectedSegmentButton : undefined,
        }))}
        style={styles.segmentedButtons}
        theme={{ colors: { secondaryContainer: skeuColors.primary, onSecondaryContainer: '#FFFFFF' } }}
      />

      {localSettings.llmProvider === 'local_qwen38' ? (
        <View style={styles.modelBox}>
          <View style={styles.modelBoxHeader}>
            <View style={[styles.statusDot, styles.statusDotBlue]} />
            <Text style={styles.modelBoxTitle}>本地 Qwen3.8</Text>
            <Text style={styles.modelBoxMeta}>约 1.45GB</Text>
          </View>
          <Text style={styles.modelBoxText}>
            总结在手机本地生成。应用会在 ASR 和 LLM 之间释放上下文，降低真机内存峰值。
          </Text>
          <Button
            mode="contained"
            onPress={handlePrepareLocalLlmModel}
            style={styles.modelButton}
            buttonColor={skeuColors.primary}
            textColor="#FFFFFF"
            disabled={isPreparingLlm}
          >
            {isPreparingLlm ? '正在准备…' : '下载并加载 Qwen3.8'}
          </Button>
          {!!localLlmStatus && <Text style={styles.modelStatus}>{localLlmStatus}</Text>}
        </View>
      ) : (
        <>
          {renderTextInput('Base URL', 'llmBaseUrl', { placeholder: 'https://api.openai.com/v1' })}
          {renderTextInput('API Key', 'llmApiKey', {
            secureTextEntry: !showLlmKey,
            right: (
              <TextInput.Icon
                icon={showLlmKey ? 'eye-off' : 'eye'}
                onPress={() => setShowLlmKey((visible) => !visible)}
                color={skeuColors.textSecondary}
              />
            ),
          })}
          {renderTextInput('模型名称', 'llmModel', { placeholder: 'gpt-4o-mini' })}
        </>
      )}

      {renderTextInput('系统提示词', 'systemPrompt', {
        multiline: true,
        numberOfLines: 4,
        style: [styles.input, styles.multilineInput],
        placeholder: '告诉会议助手你希望如何整理内容',
      })}

      <View style={styles.subsectionDivider} />
      <Text style={styles.subsectionTitle}>语音合成（可选）</Text>
      <Text style={styles.sectionDescription}>用于朗读总结，不影响录音和转录。</Text>
      {renderTextInput('Base URL', 'ttsBaseUrl', { placeholder: 'https://api.openai.com/v1' })}
      {renderTextInput('API Key', 'ttsApiKey', {
        secureTextEntry: !showTtsKey,
        right: (
          <TextInput.Icon
            icon={showTtsKey ? 'eye-off' : 'eye'}
            onPress={() => setShowTtsKey((visible) => !visible)}
            color={skeuColors.textSecondary}
          />
        ),
      })}
      <View style={styles.inlineInputs}>
        <View style={styles.inlineInputFlex}>{renderTextInput('模型名称', 'ttsModel', { placeholder: 'tts-1' })}</View>
        <View style={styles.inlineInputFlex}>{renderTextInput('语音', 'ttsVoice', { placeholder: 'alloy' })}</View>
      </View>
    </View>
  );

  const renderToggleRow = (
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'],
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={skeuColors.primary} />
      </View>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        color={skeuColors.primary}
        thumbColor={value ? '#FFFFFF' : skeuColors.textMuted}
        trackColor={{ false: '#DDE2EB', true: skeuColors.primaryLight }}
      />
    </View>
  );

  const renderRecordingMode = () => {
    const localReady = localSettings.sttProvider === 'local_r2t2';
    return (
      <View style={styles.modeBody}>
        <Text style={styles.sectionTitle}>录音工作流</Text>
        <Text style={styles.sectionDescription}>
          录音期间只保留轻量状态反馈；切片、转写和总结会在后台排队，不会弹窗打断会议。
        </Text>

        <View style={styles.workflowCard}>
          <View style={styles.workflowHeader}>
            <View style={[styles.workflowIcon, localReady ? styles.workflowIconReady : styles.workflowIconCloud]}>
              <MaterialCommunityIcons
                name={localReady ? 'cellphone-check' : 'cloud-outline'}
                size={22}
                color={localReady ? '#2FAE87' : skeuColors.primary}
              />
            </View>
            <View style={styles.workflowCopy}>
              <Text style={styles.workflowTitle}>{localReady ? '本地 R2T2 已选择' : '云端识别已选择'}</Text>
              <Text style={styles.workflowDescription}>
                {localReady ? '音频不离开设备，支持逐 token 转写预览' : '停止录音后按切片顺序上传并处理'}
              </Text>
            </View>
            <View style={[styles.readyPill, localReady ? styles.readyPillGreen : styles.readyPillOrange]}>
              <Text style={styles.readyPillText}>{localReady ? '离线' : '在线'}</Text>
            </View>
          </View>
        </View>

        {renderToggleRow(
          'text-box-search-outline',
          localReady ? '边录边转写' : '切片后立即处理',
          localReady ? '每段切片完成后立即流式回传文字' : '每段落盘后排队上传，云端只回传最终文本',
          localSettings.recordingStreaming,
          (value) => updateField('recordingStreaming', value)
        )}
        {renderToggleRow(
          'auto-upload',
          '自动处理录音',
          '停止录音后自动转写并生成总结，结果会出现在会议列表',
          localSettings.recordingAutoTranscribe,
          (value) => updateField('recordingAutoTranscribe', value)
        )}

        <View style={styles.segmentSetting}>
          <View style={styles.segmentSettingCopy}>
            <Text style={styles.toggleTitle}>后台切片间隔</Text>
            <Text style={styles.toggleDescription}>每段单独保存，录音不中断，也方便失败后重试</Text>
          </View>
          <View style={styles.minutesInput}>
            <TextInput
              value={String(localSettings.recordingSegmentMinutes || 5)}
              onChangeText={(value) => {
                const minutes = Number.parseInt(value.replace(/\D/g, ''), 10);
                updateField('recordingSegmentMinutes', Number.isFinite(minutes) ? Math.min(30, Math.max(1, minutes)) : 5);
              }}
              keyboardType="number-pad"
              mode="flat"
              dense
              style={styles.minutesInputField}
              underlineColor="transparent"
              activeUnderlineColor={skeuColors.primary}
              textColor={skeuColors.textPrimary}
              theme={inputTheme}
            />
            <Text style={styles.minutesSuffix}>分钟</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActiveMode = () => {
    if (activeMode === 'llm') return renderLlmMode();
    if (activeMode === 'recording') return renderRecordingMode();
    return renderSttMode();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <TouchableOpacity style={styles.appBarButton} onPress={handleBack} activeOpacity={0.9}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={skeuColors.textPrimary} />
        </TouchableOpacity>
        <Appbar.Content title="设置" titleStyle={styles.appbarTitle} />
        <TouchableOpacity style={styles.appBarSave} onPress={persistSettings} activeOpacity={0.9}>
          <MaterialCommunityIcons name="content-save-outline" size={20} color={skeuColors.primary} />
          <Text style={styles.saveStatus}>{saveStatus}</Text>
        </TouchableOpacity>
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.modeSelector}>
          <SegmentedButtons
            value={activeMode}
            onValueChange={(value) => setActiveMode(value as SettingsMode)}
            buttons={modeButtons.map((button) => ({
              ...button,
              style: activeMode === button.value
                ? [styles.modeTabButton, styles.modeTabButtonActive]
                : styles.modeTabButton,
            }))}
            density="small"
            theme={{ colors: { secondaryContainer: skeuColors.primary, onSecondaryContainer: '#FFFFFF' } }}
          />
        </View>

        <View style={[styles.modeCard, styles.modeCardRadius]}>{renderActiveMode()}</View>

        <TouchableOpacity style={[styles.resetButton, styles.resetButtonRadius]} onPress={() => setResetDialogVisible(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="restore" size={18} color={skeuColors.recordRed} />
          <Text style={styles.resetButtonText}>恢复默认设置</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTitle}>{saveStatus === '已保存' ? '设置已保存' : '修改会保存在本机'}</Text>
          <Text style={styles.bottomHint}>录音期间不会弹出处理确认</Text>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={persistSettings} activeOpacity={0.9}>
          <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>保存设置</Text>
        </TouchableOpacity>
      </View>

      <SkeuDialog
        visible={resetDialogVisible}
        title="重置设置"
        message="确定要恢复默认设置吗？"
        buttons={[
          { text: '取消', style: 'cancel', onPress: () => setResetDialogVisible(false) },
          {
            text: '确定',
            style: 'destructive',
            onPress: () => {
              resetSettings();
              setLocalSettings(defaultSettings);
              setResetDialogVisible(false);
              setSaveStatus('已恢复');
            },
          },
        ]}
        onDismiss={() => setResetDialogVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: skeuColors.background },
  appbar: {
    backgroundColor: skeuColors.background,
    elevation: 0,
    ...Platform.select({ ios: { shadowOpacity: 0 }, android: { borderBottomWidth: 0 } }),
  },
  appbarTitle: { color: skeuColors.textPrimary, fontWeight: '600', fontSize: 18 },
  appBarButton: {
    width: 40,
    height: 40,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...skeuStyles.neumorphicCard,
  },
  appBarSave: {
    minHeight: 40,
    marginRight: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...skeuStyles.neumorphicCard,
  },
  saveStatus: { color: skeuColors.primaryDark, fontSize: 12, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 130 },
  modeSelector: {
    marginBottom: 14,
    padding: 4,
    ...skeuStyles.neumorphicCard,
    borderRadius: 20,
  },
  modeTabButton: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  modeTabButtonActive: {
    ...skeuStyles.neumorphicCard,
    backgroundColor: skeuColors.primary,
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 16,
    marginVertical: 2,
    marginHorizontal: 2,
  },
  modeCard: { ...skeuStyles.neumorphicCard, padding: 20 },
  modeCardRadius: { borderRadius: 26 },
  modeBody: { gap: 10 },
  sectionTitle: { color: skeuColors.textPrimary, fontSize: 19, fontWeight: '700' },
  sectionDescription: { color: skeuColors.textSecondary, fontSize: 14, lineHeight: 21 },
  segmentedButtons: { marginTop: 4, marginBottom: 2 },
  helperText: { color: skeuColors.textSecondary, marginHorizontal: -4, marginBottom: 2 },
  inputWrapper: { marginTop: 6, ...skeuStyles.neumorphicInset, overflow: 'hidden' },
  inputWrapperRadius: { borderRadius: 16 },
  input: { backgroundColor: 'transparent', paddingHorizontal: 14 },
  selectedSegmentButton: {
    ...selectedSegmentShadow,
  },
  multilineInput: { minHeight: 100 },
  modelBox: { marginTop: 6, padding: 16, borderRadius: 18, backgroundColor: '#EEF4FF' },
  modelBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2FAE87' },
  statusDotBlue: { backgroundColor: skeuColors.info },
  modelBoxTitle: { color: skeuColors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  modelBoxMeta: { color: skeuColors.textSecondary, fontSize: 12 },
  modelBoxText: { color: skeuColors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  modelButton: { borderRadius: 12 },
  modelStatus: { color: skeuColors.info, fontSize: 13, marginTop: 10 },
  subsectionDivider: { height: 1, backgroundColor: 'rgba(176, 188, 206, 0.28)', marginTop: 10, marginBottom: 6 },
  subsectionTitle: { color: skeuColors.textPrimary, fontSize: 16, fontWeight: '700' },
  inlineInputs: { flexDirection: 'row', gap: 10 },
  inlineInputFlex: { flex: 1 },
  workflowCard: { padding: 14, borderRadius: 18, backgroundColor: '#F7F9FC', marginTop: 2 },
  workflowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  workflowIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  workflowIconReady: { backgroundColor: '#E0F6EE' },
  workflowIconCloud: { backgroundColor: '#FFF0E0' },
  workflowCopy: { flex: 1 },
  workflowTitle: { color: skeuColors.textPrimary, fontSize: 14, fontWeight: '700' },
  workflowDescription: { color: skeuColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 2 },
  readyPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  readyPillGreen: { backgroundColor: '#D9F4E9' },
  readyPillOrange: { backgroundColor: '#FFE8C9' },
  readyPillText: { color: skeuColors.textPrimary, fontSize: 11, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(176, 188, 206, 0.22)' },
  toggleIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0E0' },
  toggleCopy: { flex: 1 },
  toggleTitle: { color: skeuColors.textPrimary, fontSize: 14, fontWeight: '700' },
  toggleDescription: { color: skeuColors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 2 },
  segmentSetting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 15 },
  segmentSettingCopy: { flex: 1, paddingRight: 12 },
  minutesInput: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  minutesInputField: { width: 54, height: 42, backgroundColor: 'transparent', textAlign: 'center' },
  minutesSuffix: { color: skeuColors.textSecondary, fontSize: 13 },
  resetButton: { marginTop: 18, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...skeuStyles.neumorphicCard },
  resetButtonRadius: { borderRadius: 16 },
  resetButtonText: { color: skeuColors.recordRed, fontSize: 14, fontWeight: '700' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 20, backgroundColor: skeuColors.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, ...Platform.select({ ios: { shadowColor: skeuColors.shadowDark, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } }, android: { elevation: 10 } }) },
  bottomTitle: { color: skeuColors.textPrimary, fontSize: 13, fontWeight: '700' },
  bottomHint: { color: skeuColors.textMuted, fontSize: 11, marginTop: 2 },
  saveButton: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: skeuColors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
