const { defineConfig } = require("cypress");
const webpackPreprocessor = require("@cypress/webpack-preprocessor");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const options = {
        webpackOptions: {
          resolve: {
            // 1. Tell Webpack where to find the fallbacks
            fallback: {
              os: require.resolve('os-browserify/browser'),
              process: require.resolve('process/browser'),
            },
            // 2. Map the "node:" scheme to the polyfills
            alias: {
              'node:os': 'os-browserify/browser',
              'node:process': 'process/browser',
            }
          },
        },
      };

      // 3. Apply the custom webpack config to Cypress
      on("file:preprocessor", webpackPreprocessor(options));
      
      return config;
    },
  },
});