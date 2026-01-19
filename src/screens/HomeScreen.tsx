import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import {
  Appbar,
  FAB,
  Card,
  Title,
  Paragraph,
  IconButton,
  Text,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMeetingStore, useSettingsStore } from '../store';
import { formatDate, formatDuration, truncateText, skeuColors, skeuStyles } from '../utils';
import { MeetingNote } from '../types';
import { SkeuDialog } from '../components';

const statusLabels: Record<MeetingNote['status'], string> = {
  recorded: '待处理',
  transcribing: '转录中...',
  summarizing: '总结中...',
  done: '已完成',
  error: '处理失败',
};

const statusColors: Record<MeetingNote['status'], string> = {
  recorded: skeuColors.warning,
  transcribing: skeuColors.info,
  summarizing: skeuColors.primary,
  done: skeuColors.success,
  error: skeuColors.error,
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { meetings, deleteMeeting } = useMeetingStore();
  const { isConfigured } = useSettingsStore();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  const handleRecordPress = () => {
    if (!isConfigured()) {
      Alert.alert(
        '请先配置 API',
        '您需要先配置 STT 和 LLM 的 API Key 才能使用录音功能',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: () => navigation.navigate('Settings') },
        ]
      );
      return;
    }
    navigation.navigate('Record');
  };

  const handleMeetingPress = (meeting: MeetingNote) => {
    navigation.navigate('Detail', { meetingId: meeting.id });
  };

  const handleDeletePress = (id: string) => {
    setSelectedMeetingId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (selectedMeetingId) {
      deleteMeeting(selectedMeetingId);
    }
    setDeleteDialogVisible(false);
    setSelectedMeetingId(null);
  };

  const renderMeetingItem = ({ item }: { item: MeetingNote }) => (
    <View style={styles.card}>
      <Card
        style={styles.cardInner}
        onPress={() => handleMeetingPress(item)}
        mode="contained"
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>{item.title}</Title>
            <IconButton
              icon="trash-can-outline"
              size={20}
              iconColor={skeuColors.error}
              style={styles.deleteButton}
              onPress={() => handleDeletePress(item.id)}
            />
          </View>

          <View style={styles.cardMeta}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <View style={styles.durationBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={skeuColors.textSecondary} />
              <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
              <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                {statusLabels[item.status]}
              </Text>
            </View>
          </View>

          {item.summary && (
            <Paragraph style={styles.summaryPreview}>
              {truncateText(item.summary.replace(/[#*`]/g, ''), 100)}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  /* 
   * Updated Empty State implementation matching the 'Just a jiffy' reference 
   * - Uses an inset container (pressed in look) for the icon
   * - Clean, centered typography
  */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="microphone-outline" size={56} color={skeuColors.textMuted} />
      </View>
      <Title style={styles.emptyTitle}>暂无会议记录</Title>
      <Paragraph style={styles.emptyText}>
        点击右下角按钮开始录制您的第一个会议
      </Paragraph>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content title="会议记录" titleStyle={styles.appBarTitle} />
        {/* Skeuomorphic Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons name="cog-outline" size={22} color={skeuColors.textSecondary} />
        </TouchableOpacity>
      </Appbar.Header>

      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        renderItem={renderMeetingItem}
        contentContainerStyle={[
          styles.listContent,
          meetings.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyList}
      />

      {/* Skeuomorphic FAB - Convex style */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleRecordPress}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="microphone" size={32} color={skeuColors.primary} />
      </TouchableOpacity>

      <SkeuDialog
        visible={deleteDialogVisible}
        title="删除确认"
        message="确定要删除这条会议记录吗？此操作不可撤销。"
        buttons={[
          {
            text: '取消',
            style: 'cancel',
            onPress: () => setDeleteDialogVisible(false),
          },
          {
            text: '删除',
            style: 'destructive',
            onPress: confirmDelete,
          },
        ]}
        onDismiss={() => setDeleteDialogVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: skeuColors.background,
  },
  appBar: {
    backgroundColor: skeuColors.background,
    elevation: 0,
    ...Platform.select({
      ios: {
        shadowOpacity: 0, // Flat app bar for cleaner look
      },
      android: {
        elevation: 0,
        borderBottomWidth: 0,
      },
    }),
  },
  appBarTitle: {
    color: skeuColors.textPrimary,
    fontWeight: '600',
    fontSize: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...skeuStyles.neumorphicCard, // Convex style (includes borderRadius)
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  // Card styles - using global theme for consistency
  card: {
    marginBottom: 20,
    ...skeuStyles.neumorphicCard,
    padding: 0, // Card component handles padding
    // Override slightly if needed, but best to stick to theme
    backgroundColor: skeuColors.background,
  },
  cardInner: {
    borderRadius: 24, // Match theme radius
    backgroundColor: skeuColors.background,
    overflow: 'hidden',
    elevation: 0,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    color: skeuColors.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  deleteButton: {
    margin: -8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    color: skeuColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginRight: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: skeuColors.backgroundDark,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: skeuColors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryPreview: {
    color: skeuColors.textPrimary, // slightly darker for readability
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    ...skeuStyles.neumorphicCard, // Apply Convex shadow (includes bg and borderRadius)
  },
  // New Empty State Styles matching reference
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: -40, // Visual balance
  },
  emptyIconContainer: {
    ...skeuStyles.neumorphicInset, // Use shared inset style for the "pressed in" look
    width: 140, // Large circle
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: skeuColors.background, // Ensure match
    borderWidth: 0, // Clean
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyTitle: {
    marginBottom: 12,
    color: skeuColors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: skeuColors.textSecondary,
    maxWidth: 240,
    fontSize: 14,
    lineHeight: 24,
    opacity: 0.8,
  },
  dialog: {
    backgroundColor: skeuColors.background,
    borderRadius: 24,
  },
  dialogTitle: {
    color: skeuColors.textPrimary,
    fontWeight: '600',
  },
  dialogText: {
    color: skeuColors.textSecondary,
  },
});
