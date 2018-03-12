'use strict';

const existsSync = require('exists-sync');
const path = require('path');
const LiveReloadServer = require('ember-cli/lib/tasks/server/livereload-server');
const ExpressServer = require('ember-cli/lib/tasks/server/express-server');
const RSVP = require('rsvp');
const Task = require('../models/task');
const Watcher = require('../models/watcher');
const ServerWatcher = require('../models/server-watcher');
//const Server = require('../models/server');
const Builder = require('../models/builder');
const express = require('express');

const Promise = RSVP.Promise;

class ServeTask extends Task {
  constructor(options) {
    super(options);

    this._runDeferred = null;
    this._builder = null;
  }

  run(options) {
    let builder = this._builder = options._builder || new Builder({
      ui: this.ui,
      outputPath: options.outputPath,
      project: this.project,
      environment: options.environment,
    });

    let watcher = options._watcher || new Watcher({
      ui: this.ui,
      builder,
      analytics: this.analytics,
      options,
      serving: true,
    });

    let serverRoot = path.resolve(__dirname, '../models/server/index.js');
    let serverWatcher = null;
    if (existsSync(serverRoot)) {
      serverWatcher = new ServerWatcher({
        ui: this.ui,
        analytics: this.analytics,
        watchedDir: path.resolve(serverRoot),
        options,
      });
    }

    let expressServer = options._expressServer || new ExpressServer({
      ui: this.ui,
      project: this.project,
      watcher,
      serverRoot,
      serverWatcher,
    });

    let liveReloadServer = options._liveReloadServer || new LiveReloadServer({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      watcher,
      expressServer,
    });

    //let server = Server(this.project.root, options.liveReloadPort);

    /* hang until the user exits */
    this._runDeferred = RSVP.defer();

    return Promise.all([
      liveReloadServer.start(options),
      expressServer.start(options),
    ]).then(() => this._runDeferred.promise);
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

module.exports = ServeTask;
