'use strict';
const inquirer = require('inquirer');
const sinon = require('sinon');

const Router = require('../lib/router');
const yeoman = require('yeoman-environment');

const env = yeoman.createEnv([], { console: console });
const Home = require('../lib/routes/home');

describe('Home Route', () => {
  beforeEach(() => {
    this.router = new Router(env);
    this.router.registerRoute('home', Home);
    this.generateRoute = sinon.spy();
    this.router.registerRoute('generate', this.generateRoute);
    this.helpRoute = sinon.spy();
    this.router.registerRoute('help', this.helpRoute);
    this.exitRoute = sinon.spy();
    this.router.registerRoute('exit', this.exitRoute);
  });

  it('Allows going to the generate route', async () => {
    inquirer.prompt = () => Promise.resolve({ whatNext: 'generate' });

    await this.router.navigate('home');
    sinon.assert.calledOnce(this.generateRoute);
  });

  it('Allows going to the help route', async () => {
    inquirer.prompt = () => Promise.resolve({ whatNext: 'help' });

    await this.router.navigate('home');
    sinon.assert.calledOnce(this.helpRoute);
  });

  it('Allows going to the exit route', async () => {
    inquirer.prompt = () => Promise.resolve({ whatNext: 'exit' });

    await this.router.navigate('home');
    sinon.assert.calledOnce(this.exitRoute);
  });

  it('Fails due to unknown route', async () => {
    sinon.stub(console, 'log'); // silence console.log
    inquirer.prompt = () => Promise.resolve({ whatNext: 'randomRoute' });
    this.randomRoute = sinon.spy();
    await this.router.navigate('home');
    console.log.restore(); // restore console.log to allow for mocha test
    sinon.assert.notCalled(this.randomRoute);
  });
});
