const config = require("./package.json");
const rollup = require("rollup");

const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const serve = require("rollup-plugin-serve");

const { importExportToGlobal, dependenciesOnly } = require("rollup-split-index");

const inputFile = config.main; // likely index.js

const vendorTree = {
  // only used to determine which files to include in vendor tree
  input: inputFile,
  plugins: [resolve(), commonjs(), dependenciesOnly()],
  output: {
    // Vendor dependencies will be stored in the global namespace under this variable name
    name: "studioDependencies",
    file: "dist/vendor.js",
    format: "iife"
  }
};

const indexTree = {
  input: inputFile,
  plugins: [
    resolve(),
    commonjs(),
    importExportToGlobal({ importName: vendorTree.output.name })
  ],
  output: {
    file: "dist/index.js",
    // output format is es6, but with imports/exports rewritten to es5
    format: "es"
  }
};

if (process.env.SERVE) {
  vendorTree.plugins.push(serve());
}

module.exports = [vendorTree, indexTree];
