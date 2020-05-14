#!/usr/bin/env node
'use strict';

const minimist = require('minimist');
const chalk = require('chalk');
const rootPath = require('app-root-path');
const pkg = require(rootPath.resolve('package.json'));
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

const argv = minimist(process.argv.slice(2));
const { _: args, ...opts } = argv;

const optsArgs = {
  args,
  opts,
};

const cmd = optsArgs.args[0] || 'home';

env.optsArgs = optsArgs;
env.cmd = cmd;

function init() {
  if (optsArgs.opts.version) {
    console.log(pkg.version);
    return;
  }

  console.log(
    `${chalk.red('🤯 This is a beta command, so there could be unexpected results... 🤯')}`
  );
  console.log('');
  console.log(`${chalk.red('                   😶 Use this at your own peril 😶')}`);
  console.log('');

  env.on('error', (err) => {
    console.error('Error', process.argv.slice(2).join(' '), '\n');
    console.error(optsArgs.opts.debug ? err.stack : err.message);
    process.exit(err.code || 1);
  });

  setRoutes();

  if (optsArgs.opts.help) {
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
