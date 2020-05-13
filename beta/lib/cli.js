#!/usr/bin/env node
'use strict';

const list = require('cli-list');
const meow = require('meow');
const chalk = require('chalk');
const pkg = require('../../package.json');
const yeoman = require('yeoman-environment');
const Router = require('./router');

const env = yeoman.createEnv();
const router = new Router(env);

// Utils
const { checkGeneratorVersion } = require('./utils');

// Routes
const Home = require('./routes/home');
const Generate = require('./routes/generate');
const Help = require('./routes/help');
const Exit = require('./routes/exit');

const commands = list(process.argv.slice(2));

const cli = commands.map((command) => {
  const minicli = meow({ autoHelp: false, help: false, pkg, argv: command });
  const opts = minicli.flags;
  const args = minicli.input;
  return { opts, args };
});

const firstCmd = cli[0] || { opts: {}, args: {} };
const cmd = firstCmd.args[0] || 'home';

env.firstCmd = firstCmd;
env.cmd = cmd;

function init() {
  console.log(
    `${chalk.red('🤯 This is a beta command, so there could be unexpected results... 🤯')}`
  );
  console.log('');
  console.log(`${chalk.red('                   😶 Use this at your own peril 😶')}`);
  console.log('');

  env.on('error', (err) => {
    console.error('Error', process.argv.slice(2).join(' '), '\n');
    console.error(firstCmd.opts.debug ? err.stack : err.message);
    process.exit(err.code || 1);
  });

  setRoutes();

  if (firstCmd.opts.help) {
    router.navigate('help');
    return;
  }

  router.navigate(cmd);
}

function setRoutes() {
  router.registerRoute('home', Home);
  router.registerRoute('generate', Generate);
  router.registerRoute('help', Help);
  router.registerRoute('exit', Exit);

  process.once('exit', router.navigate.bind(router, 'exit'));
}

checkGeneratorVersion();
init();
