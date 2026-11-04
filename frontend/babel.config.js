module.exports = function (api) {
  // Must not use api.cache(true) with env-specific plugins — Babel throws
  // "Caching has already been configured with .never or .forever()".
  api.cache.using(() => process.env.NODE_ENV);

  const plugins = ["react-native-reanimated/plugin"];

  // Release bundles retain console strings in Hermes heap; strip in production builds.
  if (process.env.NODE_ENV === "production") {
    plugins.unshift([
      "transform-remove-console",
      { exclude: ["error", "warn"] },
    ]);
  }

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins,
  };
};