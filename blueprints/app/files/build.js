const MovableApp = require('@movable/cli/lib/broccoli/movable-app');
const sourcemapPathTransform = require('@movable/cli/lib/broccoli/sourcemap-path-transform');

const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const html = require("@movable/rollup-plugin-html");
const { importExportToGlobal, dependenciesOnly } = require("rollup-split-index");

module.exports = function(defaults) {
  const app = new MovableApp(defaults, {
    rollup: {
      // dist/index.js contains a rewritten app/js/index.js
      index: {
        input: 'app/js/index.js',
        plugins: [
          resolve(),
          commonjs(),
          importExportToGlobal({
            importName: 'studioDependencies'
          })
        ],
        output: {
          file: "index.js",
          // output format is es6, but with imports/exports rewritten to es5
          format: "es",
          sourcemap: true,
          sourcemapPathTransform
        }
      },
      // dist/vendor.js contains everything that app/js/index.js imports, in one file
      vendor: {
        // only used to determine which files to include in vendor tree
        input: 'app/js/index.js',
        plugins: [resolve(), commonjs(), dependenciesOnly()],
        output: {
          // Vendor dependencies will be stored in the global namespace under this variable name
          name: "studioDependencies",
          file: "vendor.js",
          format: "iife",
          sourcemap: true,
          sourcemapPathTransform
        }
      },
      // dists/tests.js bundles everything from tests/tests.js
      tests: {
        input: 'tests/tests.js',
        plugins: [html({ include: /\.html$/ }), resolve(), commonjs()],
        output: {
          file: "tests.js",
          format: "iife",
          sourcemap: true,
          sourcemapPathTransform
        }
      }

    }
  });

  return app.toTree();
};
