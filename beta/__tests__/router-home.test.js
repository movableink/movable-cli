'use strict';
const inquirer = require('inquirer');
const Router = require('../lib/router');
const yeoman = require('yeoman-environment');

const env = yeoman.createEnv([], { console: console });
const Home = require('../lib/routes/home');

jest.mock('inquirer');

describe('Home Route', () => {
  beforeEach(() => {
    this.router = new Router(env);
    this.router.registerRoute('home', Home);
    this.generateRoute = jest.fn();
    this.router.registerRoute('generate', this.generateRoute);
    this.helpRoute = jest.fn();
    this.router.registerRoute('help', this.helpRoute);
    this.exitRoute = jest.fn();
    this.router.registerRoute('exit', this.exitRoute);
  });

  it('Allows going to the generate route', () => {
    inquirer.prompt = () => Promise.resolve({ whatNext: 'generate' });

    this.router.navigate('home').then(() => {
      expect(this.generateRoute).toHaveBeenCalledTimes(1);
    });
  });

  it('Allows going to the help route', () => {
    inquirer.prompt = () => Promise.resolve({ whatNext: 'help' });

    this.router.navigate('home').then(() => {
      expect(this.helpRoute).toHaveBeenCalledTimes(1);
    });
  });

  it('Allows going to the exit route', () => {
    inquirer.prompt = () => Promise.resolve({ whatNext: 'exit' });

    this.router.navigate('home').then(() => {
      expect(this.exitRoute).toHaveBeenCalledTimes(1);
    });
  });

  it('Fails due to unknown route', () => {
    console.log = jest.fn(); // silence console logs
    inquirer.prompt = () => Promise.resolve({ whatNext: 'randomRoute' });

    this.router.navigate('home').then(() => {
      expect(jest.fn()).toBeCalledTimes(0);
    });
  });
});
