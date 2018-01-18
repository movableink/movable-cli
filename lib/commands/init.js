'use strict';

const path = require('path');
const clone = require('ember-cli-lodash-subset').clone;
const merge = require('ember-cli-lodash-subset').merge;
const Command = require('../models/command');
const Promise = require('rsvp').Promise;
const SilentError = require('silent-error');
const existsSync = require('exists-sync');
const validProjectName = require('ember-cli/lib/utilities/valid-project-name');
const normalizeBlueprint = require('ember-cli/lib/utilities/normalize-blueprint-option');
const mergeBlueprintOptions = require('ember-cli/lib/utilities/merge-blueprint-options');
const logger = require('heimdalljs-logger')('movable-cli:command:init');
const chalk = require('chalk');

module.exports = Command.extend({
  name: 'init',
  description: 'Creates a new movable-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run',     type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose',     type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint',   type: String,                  aliases: ['b'] },
    { name: 'skip-npm',    type: Boolean, default: false, aliases: ['sn'] },
    { name: 'yarn',        type: Boolean }, // no default means use yarn if the blueprint has a yarn.lock
    { name: 'name',        type: String,  default: '',    aliases: ['n'] },
  ],

  anonymousOptions: [
    '<glob-pattern>',
  ],

  _defaultBlueprint() {
    if (this.project.isEmberCLIAddon()) {
      return 'addon';
    } else {
      return 'app';
    }
  },

  beforeRun: mergeBlueprintOptions,

  run(commandOptions, rawArgs) {
    if (commandOptions.dryRun) {
      commandOptions.skipNpm = true;
    }

    let project = this.project;
    let packageName = (commandOptions.name !== '.' && commandOptions.name) || project.name();

    if (!packageName) {
      let message = `The \`ember ${this.name}\` command requires a ` +
        `package.json in current folder with name attribute or a specified name via arguments. ` +
        `For more details, use \`ember help\`.`;

      return Promise.reject(new SilentError(message));
    }

    let blueprintOpts = clone(commandOptions);

    if (blueprintOpts.yarn === undefined) {
      blueprintOpts.yarn = existsSync(path.join(project.root, 'yarn.lock'));
    }

    merge(blueprintOpts, {
      rawName: packageName,
      targetFiles: rawArgs || '',
      rawArgs: rawArgs.toString(),
      blueprint: normalizeBlueprint(blueprintOpts.blueprint || this._defaultBlueprint()),
    });

    if (!validProjectName(packageName)) {
      return Promise.reject(new SilentError(`We currently do not support a name of \`${packageName}\`.`));
    }

    return this.runTask('InstallBlueprint', blueprintOpts)
      .then(() => {
        if (!commandOptions.skipNpm) {
          return this.runTask('NpmInstall', {
            verbose: commandOptions.verbose,
            useYarn: commandOptions.yarn,
            optional: false,
          }).then(() => {
            logger.info('setting up node_modules path for project');
            project.setupNodeModulesPath();
          });
        }
      })
      .then(() => {
        if (commandOptions.skipGit === false) {
          return this.runTask('GitInit', commandOptions, rawArgs);
        }
      }).then(() => {
        const message = chalk.yellow(`Movable app successfully created. To start the dev environment, run \`movable serve\` from the app's directory. For more details, use \`movable help\`.`);
        this.ui.writeLine(message);
      });
  },
});
