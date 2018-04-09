'use strict';

const Command = require('../models/command');

module.exports = Command.extend({
  name: 'login',
  description: `Log in with your Movable Ink Dashboard credentials`,
  works: 'everywhere',

  availableOptions: [],

  run(options) {
    return this.runTask('Login', options)
      .then(() => {
        // server may be waiting around to close and holding open the event
        // loop, and we're done here
        process.exit(0);
      });
  },

  printDetailedHelp() {
    this.ui.write('Detailed help...');
  }
});
