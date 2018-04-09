'use strict';

const Task = require('../models/task');
const chalk = require('chalk');
const url = require('url');
const Config = require('../models/config');
const ApiClient = require('../models/api-client');
const OAuth = require('../models/o-auth');
const SilentError = require('silent-error');

const config = new Config();

class LoginTask extends Task {
  async run(options) {
    let ui = this.ui;
    let analytics = this.analytics;

    const oauth = new OAuth();
    await oauth.startServer();

    ui.writeLine(['\nOpen this url in your browser:',
                  chalk.underline.blue(oauth.loginURL),
                  '(\u2318-doubleclick it)\n'].join(' '));

    const code = await oauth.waitForCallback();
    const auth = await oauth.accessTokenFromCode(code);

    await config.append({ auth });

    const client = new ApiClient(config);
    const { user, company } = await client.refreshUserInfo();

    ui.writeLine(['Successfully authenticated as',
                  chalk.green(user.email),
                  'in',
                  chalk.green(company.name)].join(' '));
  }

  onInterrupt() {
    // Unfortunately the only way I can figure out how to make ctrl-c work
    // while waiting on something other than execa
    throw(new Error('interrupted'));
  }
};

module.exports = LoginTask;
