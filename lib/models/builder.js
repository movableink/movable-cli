const path = require("path");
const resolve = require("resolve");
const RSVP = require("rsvp");
const heimdall = require("heimdalljs");

class Builder {
  constructor(opts) {
    this.options = opts;
    this.root = opts.project.root;
  }

  build(willReadStringDir, resultAnnotation) {
    const projectRollup = resolve.sync("rollup", {
      basedir: this.root
    });
    const rollup = require(projectRollup);

    let buildConfig = require(path.join(this.root, "rollup.config.js"));

    if (typeof willReadStringDir === "function") {
      let tree = this.root;
      //willReadStringDir(tree);
      console.log(willReadStringDir);
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
        node.directory = path.join(this.root, 'dist');
        return {
          directory: node.directory,
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
