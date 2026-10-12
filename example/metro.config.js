const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// Expo watches only this app and node_modules. Watch the shared source too, or
// edits under ../src are ignored until Metro restarts.
config.watchFolders = [
  ...config.watchFolders,
  path.resolve(__dirname, "../src"),
];

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
