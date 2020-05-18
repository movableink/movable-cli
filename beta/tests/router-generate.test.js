'use strict';
const yeoman = require('yeoman-environment');
const inquirer = require('inquirer');
const sinon = require('sinon');
const Router = require('../lib/router');

const env = yeoman.createEnv([], { console: console });
const Generate = require('../lib/routes/generate');

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

    env.register = sinon.spy();
    env.run = sinon.spy();

    await this.router.navigate('generate');
    sinon.assert.calledOnce(env.register);
    sinon.assert.calledOnce(env.run);
  });
});
