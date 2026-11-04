module.exports = {
  assets: ['./assets/fonts/'],
  dependencies: {
    // iOS: disable FBSDK native pods (Settings.initializeSDK / auto-init). Android unchanged.
    // Restore iOS: remove this block and run `cd ios && pod install`.
    'react-native-fbsdk-next': {
      platforms: {
        ios: null,
      },
    },
  },
};
