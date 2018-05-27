/* global require, module */
'use strict';

const path = require('path');
const existsSync = require('exists-sync');

const defaultsDeep = require('ember-cli-lodash-subset').defaultsDeep;
const Project = require('../models/project');
const mergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const ConfigReplace = require('broccoli-config-replace');
const ConfigLoader = require('broccoli-config-loader');
const WatchedDir = require('broccoli-source').WatchedDir;
const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const emberAppUtils = require('ember-cli/lib/utilities/ember-app-utils');
const concat = require('broccoli-concat');

const normalizeUrl = emberAppUtils.normalizeUrl;
const convertObjectToString = emberAppUtils.convertObjectToString;
const calculateBaseTag = emberAppUtils.calculateBaseTag;

const Rollup = require("broccoli-rollup");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const html = require("rollup-plugin-html");

const { importExportToGlobal, dependenciesOnly } = require("rollup-split-index");

class MovableApp {
  /**
    MovableApp is the main class Movable CLI uses to manage the Broccoli trees
    for your application.
   **/
  constructor(defaults, options) {
    if (arguments.length === 0) {
      options = {};
    } else if (arguments.length === 1) {
      options = defaults;
    } else {
      defaultsDeep(options, defaults);
    }

    this._initProject(options);
    this.name = options.name || this.project.name();
    this.env = MovableApp.env();
    this.entryFile = (options.entryFile || this.project.pkg.main).replace(/^app\//, '');

    this._initOptions(options);
    this.trees = this.options.trees;
  }

  /**
    Returns the environment name

    @public
    @static
    @method env
    @return {String} Environment name
   */
  static env() {
    return process.env.MOVABLE_ENV || 'development';
  }

  /**
    Initializes the `options` property from the `options` parameter and
    a set of default values from Ember CLI.

    @private
    @method _initOptions
    @param {Object} options
  */
  _initOptions(options) {
    let appPath = this._resolveLocal('app');
    let appTree = new WatchedDir(appPath);

    let testsPath = this._resolveLocal('tests');
    let testsTree = existsSync(testsPath) ? new WatchedDir(testsPath) : null;

    this.options = defaultsDeep(options, {
      trees: {
        app: appTree,
        tests: testsTree
      }
    });
  }

  /**
    Initializes the `project` property from `options.project` or the
    closest Ember CLI project from the current working directory.

    @private
    @method _initProject
    @param {Object} options
  */
  _initProject(options) {
    let app = this;

    this.project = options.project || Project.closestSync(process.cwd());

    if (options.configPath) {
      this.project.configPath = function() { return app._resolveLocal(options.configPath); };
    }
  }

  /**
    Resolves a path relative to the project's root

    @private
    @method _resolveLocal
  */
  _resolveLocal(to) {
    return path.join(this.project.root, to);
  }

  /**
    Returns the tree for app/index.html

    @private
    @method index
    @return {Tree} Tree for app/index.html
  */
  index() {
    let htmlName = '/index.html';

    let index = new Funnel(this.trees.app, {
      files: ['index.html'],
      getDestinationPath: () => htmlName,
      annotation: 'Funnel: index.html',
    });

    return new ConfigReplace(index, this._configTree(), {
      configPath: path.join(this.name, 'config', 'environments', `${this.env}.json`),
      files: [htmlName],
      patterns: this._configReplacePatterns(),
    });
  }

  indexJs() {
    return new Rollup('app', {
      rollup: {
        input: this.entryFile,
        plugins: [
          resolve(),
          commonjs(),
          importExportToGlobal({
            importName: this.vendorJs().rollupOptions.output.name
          })
        ],
        output: {
          file: "index.js",
          // output format is es6, but with imports/exports rewritten to es5
          format: "es"
        }
      }
    });
  }

  vendorJs() {
    return new Rollup('app', {
      rollup: {
        // only used to determine which files to include in vendor tree
        input: this.entryFile,
        plugins: [resolve(), commonjs(), dependenciesOnly()],
        output: {
          // Vendor dependencies will be stored in the global namespace under this variable name
          name: "studioDependencies",
          file: "vendor.js",
          format: "iife"
        }
      }
    });
  }

  javascript() {
    return mergeTrees([this.indexJs(), this.vendorJs()], {
      annotation: 'TreeMerger (indexAndVendor)',
      overwrite: true
    });
  }

  /**
    Returns the tree for /tests/index.html

    @private
    @method testIndex
    @return {Tree} Tree for /tests/index.html
   */
  testIndex() {
    let index = new Funnel(this.trees.tests, {
      srcDir: '/',
      files: ['index.html'],
      destDir: '/tests',
      annotation: 'Funnel (test index)',
    });

    return new ConfigReplace(index, this._configTree(), {
      configPath: path.join(this.name, 'config', 'environments', 'test.json'),
      files: ['tests/index.html'],
      env: 'test',
      patterns: this._configReplacePatterns(),
    });
  }

  /**
    @private
    @method _configReplacePatterns
    @return
  */
  _configReplacePatterns() {
    return [{
      match: /{{rootURL}}/g,
      replacement(config) {
        return 'dist/';
      },
    }, {
      match: /{{MODULE_PREFIX}}/g,
      replacement(config) {
        return config.modulePrefix;
      },
    }];
  }

  /**
    @private
    @method _configTree
    @return
  */
  _configTree() {
    if (!this._cachedConfigTree) {
      let configPath = path.join(this.project.root, 'package.json'); // this.project.configPath();
      let configTree = new ConfigLoader('app', {
        env: this.env,
        tests: this.tests,
        project: this.project,
      });

      this._cachedConfigTree = new Funnel(configTree, {
        srcDir: '/',
        destDir: `${this.name}/config`,
        annotation: 'Funnel (config)',
      });
    }

    return this._cachedConfigTree;
  }

  tests() {
    const testsWithAppIndex = mergeTrees([this.trees.tests, this.index()], {
      overwrite: true
    });

    const foo = require('broccoli-stew').debug(testsWithAppIndex, { output: 'tree' });

    const rolledUp = new Rollup(foo, {
      rollup: {
        input: 'tests.js',
        plugins: [html(), resolve(), commonjs()],
        output: {
          file: "tests.js",
          format: "iife"
        }
      }
    });

    return new Funnel(rolledUp, {
      srcDir: '/',
      files: ['tests.js'],
      destDir: '/',
      annotation: 'Funnel (test javascript)',
    });
  }

  testSupportJs() {
    const qunitJs = require.resolve('qunit');
    const qunitPath = path.dirname(qunitJs);

    const qunit = new Funnel(new UnwatchedDir(qunitPath), {
      files: ['qunit.js'],
      srcDir: '/',
      destDir: '/'
    });

    const testemHooks = new Funnel(new UnwatchedDir(__dirname), {
      files: ['test-support-suffix.js'],
      srcDir: '/',
      destDir: '/'
    });

    const support = concat(mergeTrees([qunit, testemHooks]), {
      outputFile: '/test-support.js'
    });

    const testem = new Funnel(new UnwatchedDir(__dirname), {
      files: ['testem.js'],
      srcDir: '/',
      destDir: '/',
      annotation: 'Funnel (testem)'
    });

    return mergeTrees([support, testem], {
      overwrite: true,
      annotation: 'TreeMerger (testSupport)'
    });
  }

  testSupportCss() {
    const qunitJs = require.resolve('qunit');
    const qunitPath = path.dirname(qunitJs);

    const qunit = new Funnel(new UnwatchedDir(qunitPath), {
      files: ['qunit.css'],
      srcDir: '/',
      destDir: '/'
    });

    return concat(qunit, {
      outputFile: '/test-support.css'
    });
  }

  toArray() {
    let sourceTrees = [
      this.javascript(),
      this.index()
    ];

    if (this.trees.tests) {
      sourceTrees = sourceTrees.concat(this.testIndex(), this.tests(), this.testSupportJs(), this.testSupportCss());
    }

    return sourceTrees.filter(Boolean);
  }

  toTree() {
    return mergeTrees(this.toArray(), {
      overwrite: true,
      annotation: 'TreeMerger (allTrees)'
    });
  }
}

module.exports = MovableApp;
