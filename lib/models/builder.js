const findBuildFile = require('ember-cli/lib/utilities/find-build-file');
const EmberBuilder = require('ember-cli/lib/models/builder');
const MovableApp = require('../broccoli/movable-app');

/* legacy requires */
const resolve = require("resolve");
const RSVP = require("rsvp");
const heimdall = require("heimdalljs");

class Builder extends EmberBuilder {
  build(willReadStringDir, resultAnnotation) {
    if (this.legacyConfig) {
      return this.legacyBuild(...arguments);
    } else {
      return super.build(...arguments);
    }
  }

  legacyBuild(willReadStringDir) {
    const { root } = this.project;
    const projectRollup = resolve.sync("rollup", {
      basedir: root
    });
    const rollup = require(projectRollup);

    let buildConfig = findBuildFile('rollup.config.js');

    if (typeof willReadStringDir === "function") {
      willReadStringDir(root + '/app/');
      willReadStringDir(root + '/manifest.yml');
    }

    if (!Array.isArray(buildConfig)) {
      buildConfig = [buildConfig];
    }

    return heimdall.node("rollup", () => {
      return RSVP.all(
        buildConfig.map(config => {
          return rollup.rollup(config).then(bundle => {
            return bundle.write(config.output);
          });
        })
      ).then(result => {
        const node = heimdall.current;
        node.remove = function() {};
        return {
          graph: {
            __heimdall__: node
          }
        };
      });
    });
  }

  /**
   * @private
   * @method setupBroccoliBuilder
   */
  setupBroccoliBuilder() {
    this.environment = this.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || this.environment;

    let buildConfig = findBuildFile('build.js');
    if (buildConfig) {
      this.tree = buildConfig({ project: this.project });

      const broccoli = require('broccoli');
      this.builder = new broccoli.Builder(this.tree, {});
    } else if (findBuildFile('rollup.config.js')) {
      this.legacyConfig = true;
    } else {
      throw new Error('Missing build.js config, cannot build!');
    }
  }

  cleanup() {
    if (this.legacyBuild) {
      return RSVP.resolve();
    } else {
      return super.cleanup(...arguments);
    }
  }

  compatBroccoliPayload(err) {
    // TODO fix ember-cli/console-ui to handle current broccoli broccoliPayload
    let broccoliPayload = err && err.broccoliPayload;
    if (broccoliPayload) {
      if (!broccoliPayload.error) {
        let originalError = broccoliPayload.originalError || {};
        let location = broccoliPayload.location || originalError.location;
        broccoliPayload.error = {
          message: originalError.message,
          stack: originalError.stack,
          errorType: originalError.type || 'Build Error',
          codeFrame: originalError.frame || originalError.codeFrame || originalError.message,
          location: location || {},
        };
      }
      if (!broccoliPayload.broccoliNode) {
        broccoliPayload.broccoliNode = {
          nodeName: broccoliPayload.nodeName,
          nodeAnnotation: broccoliPayload.nodeAnnotation,
          instantiationStack: broccoliPayload.instantiationStack || '',
        };
      }
      if (!broccoliPayload.versions) {
        let builderVersion = this.broccoliBuilderFallback
          ? require('broccoli-builder/package').version
          : require('broccoli/package').version;

        broccoliPayload.versions = {
          'broccoli-builder': builderVersion,
          node: process.version,
        };
      }
    }

    throw err;
  }
}

module.exports = Builder;
