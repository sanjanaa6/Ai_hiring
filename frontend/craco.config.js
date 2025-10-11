module.exports = {
  devServer: {
    allowedHosts: "all",
  },
  webpack: {
    configure: (webpackConfig) => {
      // Remove or modify the source-map-loader rule to exclude problematic modules
      webpackConfig.module.rules = webpackConfig.module.rules.map(rule => {
        if (rule.use && rule.use.some(use => use.loader && use.loader.includes('source-map-loader'))) {
          return {
            ...rule,
            exclude: [
              ...(rule.exclude || []),
              /node_modules\/blockly/,
              /node_modules\/@radix-ui/,
              /\.mjs$/,
              /node_modules\/.*\.mjs$/,
            ],
          };
        }
        return rule;
      });
      
      // Ignore all source map related warnings and errors
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /ENOENT.*source map/,
        /blockly/,
        /@radix-ui/,
        /\.mjs$/,
        /Module build failed.*source-map-loader/,
      ];
      
      return webpackConfig;
    },
  },
};