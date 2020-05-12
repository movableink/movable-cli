'use strict';
const inquirer = require('inquirer');

const Home = async (app) => {
  const questions = [
    {
      type: 'list',
      name: 'whatNext',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Generate a blueprint',
          value: 'generate',
        },
        {
          name: 'Get some help',
          value: 'help',
        },
        {
          name: 'Get you out of this place!',
          value: 'exit',
        },
      ],
    },
  ];

  const answers = await inquirer.prompt(questions);
  app.navigate(answers.whatNext);

  return;
};

module.exports = Home;
