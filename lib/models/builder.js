const path = require("path");
const resolve = require("resolve");
const RSVP = require("rsvp");
const CoreObject = require('core-object');
const heimdall = require("heimdalljs");
const SilentError = require('silent-error');
const findBuildFile = require('ember-cli/lib/utilities/find-build-file');
const Rollup = require('broccoli-rollup');
const mergeTrees = require('broccoli-merge-trees');
const EmberBuilder = require('ember-cli/lib/models/builder');
const MovableApp = require('../broccoli/movable-app');

class Builder extends EmberBuilder {
  /**
   * @private
   * @method setupBroccoliBuilder
   */
  setupBroccoliBuilder() {
    this.environment = this.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || this.environment;

    const broccoli = require('broccoli-builder');

    let buildConfig = findBuildFile('build.js');
    if (buildConfig) {
      this.tree = buildConfig({ project: this.project });
    } else {
      this.tree = new MovableApp({ project: this.project }).toTree();
    }

    this.builder = new broccoli.Builder(this.tree);
  }
}

module.exports = Builder;
