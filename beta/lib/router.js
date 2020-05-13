'use strict';
const Configstore = require('configstore');
const rootPath = require('app-root-path');
const chalk = require('chalk');

/**
 * The router is in charge of handling `yo` different screens.
 * @constructor
 * @param  {Environment} env A yeoman environment instance
 * @param  {Configstore} [conf] An optional config store instance
 */
class Router {
  constructor(env, conf) {
    const pkg = require(rootPath.resolve('package.json'));
    this.routes = {};
    this.env = env;
    this.conf =
      conf ||
      new Configstore(pkg.name, {
        generatorRunCount: {},
      });
  }

  /**
   * Navigate to a route
   * @param  {String} name Route name
   * @param  {*}      arg  A single argument to pass to the route handler
   */
  navigate(name, arg) {
    if (typeof this.routes[name] === 'function') {
      return this.routes[name].call(null, this, arg);
    }

    console.log(
      `${chalk.green(`No command called ${name}. Use the following to list available options:`)}`
    );
    console.log('');
    console.log(`  $ movable --help `);
    console.log('');
    return;
  }

  /**
   * Register a route handler
   * @param {String}   name    Name of the route
   * @param {Function} handler Route handler
   */
  registerRoute(name, handler) {
    this.routes[name] = handler;
    return this;
  }
}

module.exports = Router;
