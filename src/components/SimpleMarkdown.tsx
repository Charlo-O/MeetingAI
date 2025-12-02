import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimpleMarkdownProps {
  children: string;
}

// 简单的 Markdown 渲染组件（支持基本语法）
export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ children }) => {
  if (!children) {
    return <Text style={styles.text}>暂无内容</Text>;
  }

  const lines = children.split('\n');
  
  const renderLine = (line: string, index: number) => {
    // 标题
    if (line.startsWith('### ')) {
      return <Text key={index} style={styles.h3}>{line.slice(4)}</Text>;
    }
    if (line.startsWith('## ')) {
      return <Text key={index} style={styles.h2}>{line.slice(3)}</Text>;
    }
    if (line.startsWith('# ')) {
      return <Text key={index} style={styles.h1}>{line.slice(2)}</Text>;
    }
    
    // 列表项
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{renderInlineStyles(line.slice(2))}</Text>
        </View>
      );
    }
    
    // 数字列表
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.number}>{numberedMatch[1]}.</Text>
          <Text style={styles.listText}>{renderInlineStyles(line.slice(numberedMatch[0].length))}</Text>
        </View>
      );
    }
    
    // 空行
    if (line.trim() === '') {
      return <View key={index} style={styles.spacer} />;
    }
    
    // 普通段落
    return <Text key={index} style={styles.text}>{renderInlineStyles(line)}</Text>;
  };
  
  // 处理行内样式（粗体、斜体）
  const renderInlineStyles = (text: string): string => {
    // 移除 ** 和 * 标记，简单处理
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1');
  };

  return (
    <View style={styles.container}>
      {lines.map((line, index) => renderLine(line, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
    color: '#333',
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    color: '#333',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    color: '#333',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    width: 16,
  },
  number: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    width: 24,
  },
  listText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    flex: 1,
  },
  spacer: {
    height: 8,
  },
});
