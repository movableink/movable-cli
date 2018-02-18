'use strict';

const Command = require('../models/command');
const lookupCommand = require('ember-cli/lib/cli/lookup-command');
const stringUtils = require('ember-cli-string-utils');
const GenerateCommand = require('ember-cli/lib/commands/generate');
const RootCommand = require('ember-cli/lib/utilities/root-command');
const JsonGenerator = require('ember-cli/lib/utilities/json-generator');

module.exports = Command.extend({
  name: 'deploy',
  description: 'Deploy the app to a server',
  works: 'insideProject',

  anonymousOptions: [
    '<environment>'
  ],

  run(commandOptions, rawArgs) {
    commandOptions.environment = rawArgs.shift();

    return this.runTask('Deploy', commandOptions);
  }
});
