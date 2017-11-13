'use strict';

const Command = require('../models/command');
const lookupCommand = require('ember-cli/lib/cli/lookup-command');
const stringUtils = require('ember-cli-string-utils');
const GenerateCommand = require('ember-cli/lib/commands/generate');
const RootCommand = require('ember-cli/lib/utilities/root-command');
const JsonGenerator = require('ember-cli/lib/utilities/json-generator');

module.exports = Command.extend({
  name: 'help',
  description: 'Outputs the usage instructions for all commands or the provided command',
  aliases: [undefined, 'h', '--help', '-h'],
  works: 'everywhere',

  availableOptions: [
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'json',    type: Boolean, default: false },
  ],

  anonymousOptions: [
    '<command-name (Default: all)>',
  ],

  run(commandOptions, rawArgs) {
    if (commandOptions.json) {
      this._printJsonHelp(commandOptions);
    } else {
      this._printHelp(commandOptions, rawArgs);
    }
  },

  _printHelp(commandOptions, rawArgs) {
    let rootCommand = new RootCommand({
      ui: this.ui,
      project: this.project,
      commands: this.commands,
      tasks: this.tasks,
      name: 'studio'
    });

    if (rawArgs.length === 0) {
      this.ui.writeLine(rootCommand.printBasicHelp(commandOptions));
      // Display usage for all commands.
      this.ui.writeLine('Available commands in studio-cli:');
      this.ui.writeLine('');

      Object.keys(this.commands).forEach(function(commandName) {
        this._printHelpForCommand(commandName, false, commandOptions);
      }, this);

      if (this.project.eachAddonCommand) {
        this.project.eachAddonCommand((addonName, commands) => {
          this.commands = commands;

          this.ui.writeLine('');
          this.ui.writeLine(`Available commands from ${addonName}:`);

          Object.keys(this.commands).forEach(function(commandName) {
            this._printHelpForCommand(commandName, false, commandOptions);
          }, this);
        });
      }
    } else {
      // If args were passed to the help command,
      // attempt to look up the command for each of them.

      this.ui.writeLine('Requested studio-cli commands:');
      this.ui.writeLine('');

      if (this.project.eachAddonCommand) {
        this.project.eachAddonCommand((addonName, commands) => {
          Object.assign(this.commands, commands);
        });
      }

      let multipleCommands = [GenerateCommand.prototype.name].concat(GenerateCommand.prototype.aliases);
      if (multipleCommands.indexOf(rawArgs[0]) > -1) {
        let command = rawArgs.shift();
        if (rawArgs.length > 0) {
          commandOptions.rawArgs = rawArgs;
        }
        rawArgs = [command];
      }

      // Iterate through each arg beyond the initial 'help' command,
      // and try to display usage instructions.
      rawArgs.forEach(function(commandName) {
        this._printHelpForCommand(commandName, true, commandOptions);
      }, this);
    }
  },

  _printJsonHelp(commandOptions) {
    let generator = new JsonGenerator({
      ui: this.ui,
      project: this.project,
      commands: this.commands,
      tasks: this.tasks,
    });

    let json = generator.generate(commandOptions);

    let outputJsonString = JSON.stringify(json, null, 2);

    this.ui.writeLine(outputJsonString);
  },

  _printHelpForCommand(commandName, detailed, options) {
    let command = this._resolveCommand(commandName);

    if (!command.skipHelp || detailed) {
      this.ui.writeLine(command.printBasicHelp(options));
    }

    if (detailed) {
      command.printDetailedHelp(options);
    }
  },

  _resolveCommand(commandName) {
    let Command = this.commands[stringUtils.classify(commandName)] ||
                  this._lookupCommand(this.commands, commandName);

    return new Command({
      ui: this.ui,
      project: this.project,
      commands: this.commands,
      tasks: this.tasks,
    });
  },

  _lookupCommand(commands, commandName) {
    return lookupCommand(commands, commandName);
  },
});
