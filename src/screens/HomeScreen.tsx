import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import {
  Appbar,
  FAB,
  Card,
  Title,
  Paragraph,
  Chip,
  IconButton,
  Text,
  useTheme,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { useMeetingStore, useSettingsStore } from '../store';
import { formatDate, formatDuration, truncateText } from '../utils';
import { MeetingNote } from '../types';

const statusLabels: Record<MeetingNote['status'], string> = {
  recorded: '待处理',
  transcribing: '转录中...',
  summarizing: '总结中...',
  done: '已完成',
  error: '处理失败',
};

const statusColors: Record<MeetingNote['status'], string> = {
  recorded: '#ff9800',
  transcribing: '#2196f3',
  summarizing: '#9c27b0',
  done: '#4caf50',
  error: '#f44336',
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
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
    <Card
      style={styles.card}
      onPress={() => handleMeetingPress(item)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title style={styles.cardTitle}>{item.title}</Title>
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={() => handleDeletePress(item.id)}
          />
        </View>
        
        <View style={styles.cardMeta}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          <Chip
            style={[styles.durationChip]}
            textStyle={styles.durationText}
            icon="clock-outline"
          >
            {formatDuration(item.duration)}
          </Chip>
        </View>
        
        <Chip
          style={[styles.statusChip, { backgroundColor: statusColors[item.status] + '20' }]}
          textStyle={[styles.statusText, { color: statusColors[item.status] }]}
        >
          {statusLabels[item.status]}
        </Chip>
        
        {item.summary && (
          <Paragraph style={styles.summaryPreview}>
            {truncateText(item.summary.replace(/[#*`]/g, ''), 100)}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎙️</Text>
      <Title style={styles.emptyTitle}>暂无会议记录</Title>
      <Paragraph style={styles.emptyText}>
        点击下方按钮开始录制您的第一个会议
      </Paragraph>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="会议记录" />
        <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
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
      
      <FAB
        icon="microphone"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleRecordPress}
        color="white"
      />
      
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>删除确认</Dialog.Title>
          <Dialog.Content>
            <Paragraph>确定要删除这条会议记录吗？此操作不可撤销。</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>取消</Button>
            <Button onPress={confirmDelete} textColor="#f44336">删除</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    color: '#666',
    marginRight: 12,
  },
  durationChip: {
    height: 28,
  },
  durationText: {
    fontSize: 12,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
  },
  summaryPreview: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
});
