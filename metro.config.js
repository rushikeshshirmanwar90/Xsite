const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent aggressive minification that strips keyboard handlers
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
  compress: {
    drop_console: false,
    keep_fnames: true,
  },
};

// Ensure keyboard event handlers are preserved
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;