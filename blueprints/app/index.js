"use strict";

const stringUtil = require("ember-cli-string-utils");

module.exports = {
  description: "The default blueprint for studio-cli projects.",

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
  }
};
