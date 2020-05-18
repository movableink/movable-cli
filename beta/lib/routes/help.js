'use strict';
const readPkgUp = require('read-pkg-up');
const chalk = require('chalk');
const resolveCwd = require('resolve-cwd');
const { helpText } = require('../utils');

const Help = (app) => {
  const { env } = app;

  // determine if we are in a movable blueprint dir or a seperate dir
  const cwd = process.cwd();
  const { packageJson = {} } = readPkgUp.sync(cwd) || {};
  const { movableInk = {}, devDependencies = {} } = packageJson;

  // no blueprint found so lets just display the default CLI help text
  if (!movableInk.blueprint) {
    helpText();
    return;
  }

  const { blueprint = '' } = movableInk;
  const version = devDependencies[blueprint] || '@latest';
  const packagePath = resolveCwd.silent(`${blueprint}/app/utils/`);

  // if package not found show default CLI help text
  if (!packagePath) {
    helpText();
    return;
  }

  const { helpText: packageHelpText } = require(packagePath);

  // if package help text is not a function show default CLI
  if (typeof packageHelpText !== 'function') {
    helpText();
    return;
  }

  console.log('');
  console.log(`${chalk.green(`This project was built using:`)}`);
  console.log(`   Generator: ${chalk.magenta(`${blueprint}`)}`);
  console.log(`   Version: ${chalk.magenta(`${version}`)}`);
  console.log('');
  console.log(`${chalk.green(`You can run the following commands:`)}`);
  packageHelpText();
  return;
};

module.exports = Help;
