'use strict';

const Command = require('../models/command');
const Config = require('../models/config');

module.exports = Command.extend({
  name: 'login',
  description: `Log in with your Movable Ink Dashboard credentials`,
  works: 'everywhere',

  availableOptions: [],

  run(options) {
    const opts = Object.assign({}, require('../defaults'), options);
    opts.userConfig = opts.userConfig || new Config(opts.userConfigPath);

    return this.runTask('Login', opts);
  }
});
