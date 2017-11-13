const rollupConfig = require("./rollup.config.js");

module.exports = function(config) {
  config.set({
    browsers: ["ChromeHeadless"],
    frameworks: ["qunit"],
    files: ["index.js", "tests/helper.js", "tests/**/*.js", "index.html"],
    crossOriginAttribute: false, // otherwise can't load remote scripts

    preprocessors: {
      "index.html": ["html2js"],
      "index.js": ["rollup"]
    },

    rollupPreprocessor: rollupConfig,

    html2JsPreprocessor: {
      processPath: function(filePath) {
        // Drop the file extension
        return filePath.replace(/\.html$/, "");
      }
    }
  });
};
