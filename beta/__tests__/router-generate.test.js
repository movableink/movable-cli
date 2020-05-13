'use strict';
const inquirer = require('inquirer');
const yeoman = require('yeoman-environment');
const Router = require('../lib/router');

const env = yeoman.createEnv([], { console: console });
const Generate = require('../lib/routes/generate');

jest.mock('inquirer');

describe('Generate Route', () => {
  beforeEach(() => {
    this.router = new Router(env);
    this.router.registerRoute('generate', Generate);
  });

  it('Runs specified blueprint to generate', async () => {
    inquirer.prompt = () =>
      Promise.resolve({
        blueprint: '@movable-internal/generator-remote-upload-blueprint',
      });

    env.register = jest.fn();
    env.run = jest.fn();

    await this.router.navigate('generate');

    expect(env.register).toHaveBeenCalledTimes(1);
    expect(env.run).toHaveBeenCalledTimes(1);
  });
});
