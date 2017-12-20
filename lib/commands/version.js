'use strict';

const Command = require('../models/command');

module.exports = Command.extend({
  name: 'version',
  description: 'outputs ember-cli version',
  aliases: ['v', '--version', '-v'],
  works: 'everywhere',

  availableOptions: [
    { name: 'verbose', type: Boolean, default: false },
  ],

  run(options) {
    let output = [require('../../package.json').version];
    this.printVersion('studio-cli', output);

    let versions = process.versions;
    versions['os'] = `${process.platform} ${process.arch}`;

    let alwaysPrint = ['node', 'os'];

    for (let module in versions) {
      if (options.verbose || alwaysPrint.indexOf(module) > -1) {
        this.printVersion(module, versions[module]);
      }
    }
  },

  printVersion(module, version) {
    this.ui.writeLine(`${module}: ${version}`);
  },
});
