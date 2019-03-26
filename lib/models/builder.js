const path = require("path");
const resolve = require("resolve");
const RSVP = require("rsvp");
const heimdall = require("heimdalljs");

class Builder {
  constructor(opts) {
    this.options = opts;
    this.root = opts.project.root;
    this.cache = [];
  }

  build(willReadStringDir, resultAnnotation) {
    const projectRollup = resolve.sync("rollup", {
      basedir: this.root
    });
    const rollup = require(projectRollup);

    let buildConfig = require(path.join(this.root, "rollup.config.js"));

    if (typeof willReadStringDir === "function") {
      willReadStringDir(this.root);
    }

    if (!Array.isArray(buildConfig)) {
      buildConfig = [buildConfig];
    }

    return heimdall.node("rollup", () => {
      return RSVP.all(
        buildConfig.map((config, index) => {
          config.cache = this.cache[index];

          return rollup.rollup(config).then(bundle => {
            this.cache[index] = bundle.cache;
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

  cleanup(run) {
    return RSVP.resolve();
  }
}

module.exports = Builder;
