"use strict";

const fs = require("fs");
const path = require("path");
const stringUtil = require("ember-cli-string-utils");

module.exports = {
  description: "The default blueprint for movable-cli projects.",

  locals(options) {
    let entity = options.entity;
    let rawName = entity.name;
    let name = stringUtil.dasherize(rawName);
    let namespace = stringUtil.classify(rawName);

    return {
      name,
      modulePrefix: name,
      namespace,
      emberCLIVersion: require("../../package").version,
      yarn: options.yarn,
      welcome: options.welcome
    };
  },

  afterInstall(options) {
    if (!options.dryRun) {
      const setupDeploy = path.join(this.project.root, 'bin', 'setup-deploy');
      fs.chmodSync(setupDeploy, '0755');
    }
  }
};
