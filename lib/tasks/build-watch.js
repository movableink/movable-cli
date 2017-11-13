"use strict";

const chalk = require("chalk");
const Task = require("../models/task");
const Watcher = require("../models/watcher");
const Builder = require("../models/builder");
const RSVP = require("rsvp");

class BuildWatchTask extends Task {
  constructor(options) {
    super(options);

    this._builder = null;
    this._runDeferred = null;
  }

  run(options) {
    this.ui.startProgress(chalk.green("Building"), chalk.green("."));

    this._runDeferred = RSVP.defer();

    let builder = (this._builder =
      options._builder ||
      new Builder({
        ui: this.ui,
        outputPath: options.outputPath,
        environment: options.environment,
        project: this.project
      }));

    let watcherType = options && options.watcher;
    let saneWatcher = new (require('ember-cli-broccoli-sane-watcher'))(builder, {
      verbose: false,
      poll: watcherType === 'polling',
      watchman: watcherType === 'watchman' || watcherType === 'events',
      node: watcherType === 'node',
      ignored: /^(node_modules|dist|tmp)/
    });

    let watcher =
      options._watcher ||
      new Watcher({
        ui: this.ui,
        builder,
        analytics: this.analytics,
        watcher: saneWatcher,
        options
      });

    return watcher.then(
      () => this._runDeferred.promise /* Run until failure or signal to exit */
    );
  }

  /**
   * Exit silently
   *
   * @private
   * @method onInterrupt
   */
  onInterrupt() {
    return this._builder.cleanup().then(() => this._runDeferred.resolve());
  }
}

module.exports = BuildWatchTask;
