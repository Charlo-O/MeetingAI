import { StyleSheet, Platform } from 'react-native';
import { MD3LightTheme } from 'react-native-paper';

// ==================== 颜色定义 ====================
export const skeuColors = {
  // 主背景色 - 严格统一 (Same Color Background)
  background: '#F2F3F7',
  backgroundDark: '#F2F3F7', // Strict same color
  backgroundLight: '#FFFFFF',

  // 主色调 - 活力橙 (Vibrant yet Soft)
  primary: '#FF9F43',
  primaryLight: '#FFC078',
  primaryDark: '#E58E26',

  // 渐变色端点
  gradientStart: '#FFAB91',
  gradientEnd: '#FF9F43',

  // 阴影颜色 - 极致轻柔 (Light & Shadow)
  shadowDark: '#D1D9E6', // 冷调灰蓝
  shadowLight: '#FFFFFF',
  shadowDarkStrong: '#A6B0C3', // 稍深一点用于极小元素

  // 文字颜色 - 低对比度 (Low Contrast)
  textPrimary: '#4A5568', // 深灰而非纯黑
  textSecondary: '#718096', // 中灰
  textMuted: '#A0AEC0',

  // 功能色 - 柔和版
  success: '#55EFC4',
  warning: '#FFEAA7',
  error: '#FF7675',
  info: '#74B9FF',

  // 录音按钮特殊色 (珊瑚红)
  recordRed: '#FF6B6B',
  recordRedLight: '#FF8787',
  recordRedDark: '#EE5253',
  recordGradientStart: '#FF9F9F',
  recordGradientEnd: '#FF6B6B',

  // 卡片背景 - 必须与背景同色
  cardBackground: '#F2F3F7',
  surfaceLight: '#F7F9FC',
};

// ==================== 轻拟物阴影样式 ====================
// ==================== 轻拟物阴影样式 ====================
export const skeuStyles = StyleSheet.create({
  // 凸起效果 (Extruded / Convex) - 静止状态
  neumorphicCard: {
    backgroundColor: skeuColors.background,
    borderRadius: 30, // 圆润造型 (Rounded Shapes)
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDark,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        // Hack: combining heavy shadow with light background to simulate 2 light sources requires wrapper usually, 
        // but here we simplify with a strong primary shadow and light background color
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: `8px 8px 16px ${skeuColors.shadowDark}, -8px -8px 16px ${skeuColors.shadowLight}`,
      }
    }),
  },

  // 凹陷效果 (Pressed / Concave) - 激活状态
  neumorphicInset: {
    backgroundColor: skeuColors.background,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        backgroundColor: '#E6E7EE', // iOS fallback
      },
      android: {
        backgroundColor: '#E6E7EE', // Android fallback
        elevation: 0,
      },
      web: {
        boxShadow: `inset 6px 6px 12px ${skeuColors.shadowDark}, inset -6px -6px 12px ${skeuColors.shadowLight}`,
      }
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
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.15, // 0.35 -> 0.15
        shadowRadius: 10,
      },
      android: {
        elevation: 4, // 6 -> 4
        borderWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.8)',
        borderLeftColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomColor: 'rgba(209, 217, 230, 0.1)',
        borderRightColor: 'rgba(209, 217, 230, 0.1)',
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
        borderTopColor: 'rgba(176, 188, 206, 0.2)',
        borderLeftColor: 'rgba(176, 188, 206, 0.2)',
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
        shadowOpacity: 0.2, // 0.4 -> 0.2
        shadowRadius: 12,
      },
      android: {
        elevation: 6, // 10 -> 6
        borderWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.9)',
        borderLeftColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomColor: 'rgba(209, 217, 230, 0.2)',
        borderRightColor: 'rgba(209, 217, 230, 0.2)',
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
        shadowOpacity: 0.2, // 0.4 -> 0.2
        shadowRadius: 16,
      },
      android: {
        elevation: 8, // 12 -> 8
        borderWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.9)',
        borderLeftColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomColor: 'rgba(209, 217, 230, 0.2)',
        borderRightColor: 'rgba(209, 217, 230, 0.2)',
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
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.25, // 0.5 -> 0.25
        shadowRadius: 16, // 12 -> 16
      },
      android: {
        elevation: 6, // 10 -> 6
        borderWidth: 2, // 3 -> 2
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
        shadowOpacity: 0.5, // 0.8 -> 0.5
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
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25, // 0.5 -> 0.25
        shadowRadius: 10, // 8 -> 10
      },
      android: {
        elevation: 4,
        borderWidth: 1,
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
    backgroundColor: '#EBEDF0', // Slightly darker to look "pressed in"
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: skeuColors.shadowDarkStrong,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.1, // 0.2 -> 0.1
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
        borderWidth: 1,
        borderTopColor: 'rgba(176, 188, 206, 0.3)',
        borderLeftColor: 'rgba(176, 188, 206, 0.3)',
        borderBottomColor: 'rgba(255, 255, 255, 0.5)',
        borderRightColor: 'rgba(255, 255, 255, 0.5)',
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
        shadowOpacity: 0.2, // 0.4 -> 0.2
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
        borderWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.8)',
        borderLeftColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomColor: 'rgba(209, 217, 230, 0.2)',
        borderRightColor: 'rgba(209, 217, 230, 0.2)',
      },
    }),
  },

  // 分隔线
  divider: {
    height: 1,
    backgroundColor: 'rgba(176, 188, 206, 0.2)',
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
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.25, // 0.4 -> 0.25
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
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
    light: { offset: 4, opacity: 0.1, radius: 10 }, // 8 -> 10 (Softer)
    medium: { offset: 8, opacity: 0.15, radius: 18 }, // 16 -> 18 (Match tool's ~15px+ vibe)
    strong: { offset: 12, opacity: 0.25, radius: 24 }, // 20 -> 24
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
      elevation: offset / 2,
    },
  });
};

export default {
  skeuColors,
  skeuStyles,
  theme,
  getNeumorphicShadow,
};
