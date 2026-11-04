// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'App.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@react-navigation/*'],
              message:
                'SDK 56: import navigation APIs from expo-router/react-navigation, expo-router/js-tabs, expo-router/build/react-navigation/native-stack, or @/app/navigation/expoRouterNavigation.',
            },
          ],
        },
      ],
    },
  },
]);
