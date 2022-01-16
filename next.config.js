const withTM = require("next-transpile-modules")([
  "react-monaco-editor",
  "monaco-editor",
]);

module.exports = withTM({});
