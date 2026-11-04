const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// Prevent Metro from watching native build trees
const nativeBuildJunk = [
  /android[\\/]app[\\/]build[\\/].*/,
  /android[\\/]app[\\/]\.cxx[\\/].*/,
  /android[\\/]\.gradle[\\/].*/,
  /android[\\/]build[\\/].*/,
  /ios[\\/]build[\\/].*/,
  /ios[\\/]Pods[\\/].*/,
];
const existingBlockList = config.resolver.blockList;
const existingPatterns = Array.isArray(existingBlockList)
  ? existingBlockList
  : existingBlockList
    ? [existingBlockList]
    : [];
config.resolver.blockList = [...existingPatterns, ...nativeBuildJunk];

module.exports = withNativeWind(config, { input: "./app/globals.css" });
