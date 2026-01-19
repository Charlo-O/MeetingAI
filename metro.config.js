const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 解决 Web 端 import.meta 问题
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');

module.exports = config;
