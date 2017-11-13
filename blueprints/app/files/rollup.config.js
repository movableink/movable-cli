const config = require("./package.json");
const rollup = require("rollup");

const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");

const {
  importExportToGlobal,
  dependenciesOnly
} = require("rollup-split-index");

const inputFile = config.main; // likely index.js

module.exports = [
  {
    input: inputFile,
    plugins: [resolve(), commonjs(), dependenciesOnly()],
    output: {
      name: importExportToGlobal.referenceName,
      file: "dist/vendor.js",
      format: "iife"
    }
  },
  {
    input: inputFile,
    plugins: [resolve(), commonjs(), importExportToGlobal()],
    output: {
      file: "dist/index.js",
      format: "es"
    }
  }
];
