const rollupConfig = require("./rollup.config.js");

module.exports = function(config) {
  config.set({
    browsers: ["ChromeHeadless"],
    frameworks: ["qunit"],
    files: ["app/js/index.js", "tests/helper.js", "tests/**/*.js", "app/index.html"],
    crossOriginAttribute: false, // otherwise can't load remote scripts

    preprocessors: {
      "app/index.html": ["html2js"],
      "app/js/index.js": ["rollup"]
    },

    rollupPreprocessor: rollupConfig
  });
};
