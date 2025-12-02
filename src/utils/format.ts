// 格式化时间戳为日期字符串
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  if (date >= today) {
    return `今天 ${formatTime(date)}`;
  } else if (date >= yesterday) {
    return `昨天 ${formatTime(date)}`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${formatTime(date)}`;
  }
};

// 格式化时间 HH:MM
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 格式化时长（秒）为 MM:SS 或 HH:MM:SS
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 生成会议标题
export const generateMeetingTitle = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  let period = '';
  if (hours < 12) {
    period = '上午';
  } else if (hours < 18) {
    period = '下午';
  } else {
    period = '晚上';
  }
  
  return `${month}月${day}日${period}会议`;
};

// 截断文本
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
};
