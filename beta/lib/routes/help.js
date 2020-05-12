'use strict';
const readPkgUp = require('read-pkg-up');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { helpText } = require('../utils');

const Help = (app) => {
  const { env } = app;

  // determine if we are in a movable blueprint dir or a seperate dir
  const cwd = process.cwd();
  const { packageJson = {} } = readPkgUp.sync(cwd) || {};
  const { movableInk = {} } = packageJson;

  // no blueprint found so lets just display the default CLI help text
  if (!movableInk.blueprint) {
    helpText();
    return;
  }

  const { blueprint = '', version = '@latest' } = movableInk;

  const packagePath = path.join(cwd, `node_modules/${blueprint}/app/utils`);

  if (fs.existsSync(packagePath)) {
    const { helpText: packageHelpText } = require(packagePath);
    console.log('');
    console.log(`${chalk.green(`This project was built using:`)}`);
    console.log(`   Generator: ${chalk.magenta(`${blueprint}`)}`);
    console.log(`   Version: ${chalk.magenta(`${version}`)}`);
    console.log('');
    console.log(`${chalk.green(`You can run the following commands:`)}`);
    packageHelpText();
    return;
  }

  helpText();
  return;
};

module.exports = Help;
