import { StyleSheet, Platform } from 'react-native';
import { MD3LightTheme } from 'react-native-paper';

// ==================== 颜色定义 ====================
export const skeuColors = {
  // 主背景色 - 更浅的灰白，符合 Neu 风格
  background: '#EFEEEE',
  backgroundDark: '#E2E6EA',
  backgroundLight: '#F5F7FA',

  // 主色调 - 橙色 (参考图中的高亮色)
  primary: '#FF8A00',
  primaryLight: '#FFAB40',
  primaryDark: '#E65100',

  // 渐变色端点
  gradientStart: '#FFA726',
  gradientEnd: '#FF7043',

  // 阴影颜色
  shadowDark: '#BFCEE0', // 稍微深一点的蓝灰，增强对比度
  shadowLight: '#FFFFFF',
  shadowDarkStrong: '#A3B1C6',

  // 高光
  highlightTop: 'rgba(255, 255, 255, 0.9)',
  highlightBottom: 'rgba(163, 177, 198, 0.5)',

  // 文字颜色
  textPrimary: '#4A5568', // 深灰，柔和一点
  textSecondary: '#A0AEC0',
  textMuted: '#CBD5E0',

  // 功能色
  success: '#48BB78',
  warning: '#ECC94B',
  error: '#F56565',
  info: '#4299E1',

  // 录音按钮特殊色 (保持红色系，但调整为更柔和)
  recordRed: '#E53E3E',
  recordRedLight: '#FC8181',
  recordRedDark: '#C53030',
  recordGradientStart: '#FF6B6B',
  recordGradientEnd: '#E53E3E',

  // 卡片背景
  cardBackground: '#EFEEEE',
  surfaceLight: '#F7F9FC',
};

// ==================== 轻拟物阴影样式 ====================
export const skeuStyles = StyleSheet.create({
  // 凸起效果的卡片样式（外阴影）
  neumorphicCard: {
    backgroundColor: skeuColors.background,
    borderRadius: 24, // 更圆润
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        // 添加第二个阴影需要 View 嵌套，或者使用 trick，这里先定义主阴影
        // 注意：RN 默认不支持多重阴影，通常需要 hack 或两个 View。
        // 为了简化，Light 阴影通常由内部 View 或 Wrapper 处理，或者接受这是 "近似" 效果
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // 凸起卡片的浅色高光层（需要叠加使用）
  neumorphicCardHighlight: {
    backgroundColor: skeuColors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowLight,
        shadowOffset: { width: -6, height: -6 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderTopColor: 'rgba(255, 255, 255, 0.8)',
        borderLeftColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomColor: 'rgba(163, 177, 198, 0.2)',
        borderRightColor: 'rgba(163, 177, 198, 0.2)',
      },
    }),
  },

  // 凹陷效果的样式（内阴影模拟）
  neumorphicInset: {
    backgroundColor: skeuColors.backgroundDark, //稍微深一点
    borderRadius: 16,
    borderWidth: 0, // 去掉边框，靠颜色差
    ...Platform.select({
      ios: {
        // iOS 原生不支持 inset shadow，通常用 darker bg 模拟
        backgroundColor: '#E2E6EA',
      },
      android: {
        elevation: 0,
        backgroundColor: '#E2E6EA',
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderTopColor: 'rgba(163, 177, 198, 0.3)',
        borderLeftColor: 'rgba(163, 177, 198, 0.3)',
        borderBottomColor: 'rgba(255, 255, 255, 0.5)',
        borderRightColor: 'rgba(255, 255, 255, 0.5)',
      },
    }),
  },

  // 按钮样式
  neumorphicButton: {
    backgroundColor: skeuColors.background,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
        borderWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.7)',
        borderLeftColor: 'rgba(255, 255, 255, 0.7)',
        borderBottomColor: 'rgba(163, 177, 198, 0.2)',
        borderRightColor: 'rgba(163, 177, 198, 0.2)',
      },
    }),
  },

  // 按钮按下状态
  neumorphicButtonPressed: {
    backgroundColor: skeuColors.backgroundDark,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDarkStrong,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
        borderWidth: 1,
        borderTopColor: 'rgba(163, 177, 198, 0.3)',
        borderLeftColor: 'rgba(163, 177, 198, 0.3)',
        borderBottomColor: 'rgba(255, 255, 255, 0.5)',
        borderRightColor: 'rgba(255, 255, 255, 0.5)',
      },
    }),
  },

  // FAB浮动按钮样式
  neumorphicFab: {
    backgroundColor: skeuColors.background,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
        borderWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.8)',
        borderLeftColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomColor: 'rgba(163, 177, 198, 0.3)',
        borderRightColor: 'rgba(163, 177, 198, 0.3)',
      },
    }),
  },

  // 大型FAB按钮
  neumorphicFabLarge: {
    backgroundColor: skeuColors.background,
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
        borderWidth: 1.5,
        borderTopColor: 'rgba(255, 255, 255, 0.8)',
        borderLeftColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomColor: 'rgba(163, 177, 198, 0.3)',
        borderRightColor: 'rgba(163, 177, 198, 0.3)',
      },
    }),
  },

  // 录音按钮特殊样式
  recordButton: {
    backgroundColor: skeuColors.recordRed,
    borderRadius: 45,
    width: 90,
    height: 90,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.recordRedDark,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
        borderWidth: 3,
        borderTopColor: skeuColors.recordRedLight,
        borderLeftColor: skeuColors.recordRedLight,
        borderBottomColor: skeuColors.recordRedDark,
        borderRightColor: skeuColors.recordRedDark,
      },
    }),
  },

  // 录音按钮录音中状态
  recordButtonActive: {
    backgroundColor: skeuColors.recordRedLight,
    borderRadius: 45,
    width: 90,
    height: 90,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.recordRed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 24,
      },
      android: {
        elevation: 4,
        borderWidth: 2,
        borderColor: skeuColors.recordRed,
      },
    }),
  },

  // 小型录音按钮
  recordButtonSmall: {
    backgroundColor: skeuColors.recordRed,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.recordRedDark,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
        borderWidth: 1.5,
        borderTopColor: skeuColors.recordRedLight,
        borderLeftColor: skeuColors.recordRedLight,
        borderBottomColor: skeuColors.recordRedDark,
        borderRightColor: skeuColors.recordRedDark,
      },
    }),
  },

  // 容器背景
  screenBackground: {
    flex: 1,
    backgroundColor: skeuColors.background,
  },

  // 输入框样式
  neumorphicInput: {
    backgroundColor: '#E2E6EA',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDarkStrong,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
        borderWidth: 1,
        borderTopColor: 'rgba(163, 177, 198, 0.4)',
        borderLeftColor: 'rgba(163, 177, 198, 0.4)',
        borderBottomColor: 'rgba(255, 255, 255, 0.6)',
        borderRightColor: 'rgba(255, 255, 255, 0.6)',
      },
    }),
  },

  // 圆形图标容器
  neumorphicIconContainer: {
    backgroundColor: skeuColors.background,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
        borderWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.7)',
        borderLeftColor: 'rgba(255, 255, 255, 0.7)',
        borderBottomColor: 'rgba(163, 177, 198, 0.3)',
        borderRightColor: 'rgba(163, 177, 198, 0.3)',
      },
    }),
  },

  // 分隔线
  divider: {
    height: 1,
    backgroundColor: 'rgba(163, 177, 198, 0.3)',
    marginVertical: 12,
  },

  // 主色调渐变按钮基础样式
  primaryButton: {
    backgroundColor: skeuColors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.primaryDark,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
        borderWidth: 1,
        borderTopColor: skeuColors.primaryLight,
        borderLeftColor: skeuColors.primaryLight,
        borderBottomColor: skeuColors.primaryDark,
        borderRightColor: skeuColors.primaryDark,
      },
    }),
  },
});

// ==================== Paper 主题配置 ====================
export const theme = {
  ...MD3LightTheme,
  roundness: 20,
  colors: {
    ...MD3LightTheme.colors,
    primary: skeuColors.primary,
    primaryContainer: skeuColors.primaryLight,
    secondary: skeuColors.gradientStart,
    secondaryContainer: skeuColors.gradientEnd,
    background: skeuColors.background,
    surface: skeuColors.cardBackground,
    surfaceVariant: skeuColors.surfaceLight,
    error: skeuColors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: skeuColors.textPrimary,
    onSurface: skeuColors.textPrimary,
    onSurfaceVariant: skeuColors.textSecondary,
    outline: skeuColors.shadowDark,
    elevation: {
      level0: 'transparent',
      level1: skeuColors.background,
      level2: skeuColors.surfaceLight,
      level3: skeuColors.backgroundLight,
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
};

// ==================== 辅助函数 ====================
export const getNeumorphicShadow = (
  intensity: 'light' | 'medium' | 'strong' = 'medium'
) => {
  const config = {
    light: { offset: 4, opacity: 0.3, radius: 8 },
    medium: { offset: 8, opacity: 0.4, radius: 16 },
    strong: { offset: 12, opacity: 0.5, radius: 20 },
  };
  const { offset, opacity, radius } = config[intensity];

  return Platform.select({
    ios: {
      shadowColor: skeuColors.shadowDark,
      shadowOffset: { width: offset, height: offset },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation: offset + 2,
    },
  });
};

export default {
  skeuColors,
  skeuStyles,
  theme,
  getNeumorphicShadow,
};
