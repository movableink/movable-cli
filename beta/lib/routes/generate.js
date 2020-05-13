'use strict';
const inquirer = require('inquirer');
const { checkGeneratorVersion } = require('../utils');

const Generate = async ({ env = {} }) => {
  let args = env.optsArgs ? env.optsArgs.args : [];
  let opts = env.optsArgs ? env.optsArgs.opts : {};

  /**
   * Check to see if blueprint arg is passed to us:
   *
   * movable generate @movable-internal/remote-upload-blueprint
   * movable generate /Users/michaelnguygen/Sites/sd-packages/blueprints/remote-upload
   * movable generate ./Users/michaelnguygen/Sites/sd-packages/blueprints/remote-upload
   * movable generate ~/Sites/sd-packages/blueprints/remote-upload
   *
   * */
  args = args.filter((arg) => {
    return (
      arg.indexOf('@movable') > -1 ||
      arg.indexOf('/') === 0 ||
      arg.indexOf('.') === 0 ||
      arg.indexOf('~') === 0
    );
  });
  let blueprint = args[0] || null;

  // if no blueprint passed through lets go through the interactive UI
  if (!blueprint) {
    const questions = [
      {
        type: 'list',
        name: 'blueprint',
        message: 'What blueprint do you want to use?',
        choices: [
          {
            name: 'Studio Framework',
            value: '@movable/generator-studio-framework',
          },
          {
            name: 'Studio Package',
            value: '@movable/generator-studio-framework-package',
          },
          {
            name: 'Remote Lambda Upload',
            value: '@movable-internal/generator-remote-upload-blueprint',
          },
          {
            name: 'Transform Lambda',
            value: '@movable-internal/generator-transform-lambda-blueprint',
          },
        ],
      },
    ];

    const answers = await inquirer.prompt(questions);
    blueprint = answers.blueprint;
  }

  // if blueprint is local for testing we dont need to check the version number
  const isBlueprintLocal =
    blueprint.indexOf('/') === 0 || blueprint.indexOf('.') === 0 || blueprint.indexOf('~') === 0
      ? true
      : false;

  // register our blueprint generator (if not local) to use locally with the same namespace as the package
  if (!isBlueprintLocal) {
    await checkGeneratorVersion(blueprint);
  }

  env.register(blueprint, blueprint);

  // run our blueprint
  env.run(blueprint, opts);
};

module.exports = Generate;
