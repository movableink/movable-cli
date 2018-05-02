const MockUI = require('console-ui/mock');
const os = require('os');
const path = require('path');
const fs = require('fs');
const expect = require('chai').expect;
const nock = require('nock');
const temp = require('temp');
const RSVP = require('rsvp');
const execa = require('execa');

const movable = require('../helpers/movable');
const GitServer = require('../helpers/git-server');
const Config = require('../../lib/models/config');
const commandOptions = require('../factories/command-options');
const DeployCommand = require('../../lib/commands/deploy');
const DeployTask = require('../../lib/tasks/deploy');
const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
const { accessToken, userInfo } = require('../helpers/user-info');

// Why have same path for every test, rather than creating random
// temp directories? Because the Project model will return a singleton
// so there is no way to instantiate a second Project with a different
// directory.
let tmpPath = path.join(process.cwd(), 'tmp', 'deploy-test');

const oauthConfig = {
  client: {
    id: 'the client id',
    secret: 'the client secret'
  },
  auth: {
    tokenHost: 'https://authorization-server.org'
  },
  callbackURL: 'http://localhost:14942/oauth/callback',
  scope: 'mdk'
};

const userResponse = Object.assign({}, userInfo, { companies: [userInfo.company] });

describe('Acceptance: movable deploy', function() {
  let options, command, ui, userConfig, gitServer;

  beforeEach(async function() {
    await tmp.setup(tmpPath);
    process.chdir(tmpPath);

    await movable(['init', '--name', 'foo', '--skip-npm', '--no-skip-git'], { skipGit: false });

    const remoteGitDir = path.join(tmpPath, 'remote');
    gitServer = new GitServer(remoteGitDir, userInfo.auth.token.access_token, '/my-co/foo.git');
    await gitServer.initialize();
    await gitServer.listen(14902);

    ui = new MockUI();
    userConfig = new Config(path.join(tmpPath, '.mdk'));
    options = commandOptions({
      commands: {
        Deploy: DeployCommand
      },
      tasks: {
        Deploy: DeployTask
      },
      ui,
      project: {
        pkg: {
          name: 'foo'
        },
        isEmberCLIProject: () => true
      },
      oauth: oauthConfig,
      dashboardURL: 'https://api-server.org',
      userConfig,
      remoteURL: 'http://localhost:14902'
    });

    const userStub = nock('https://api-server.org')
      .get('/user/info')
      .reply(200, JSON.stringify(userResponse));

    command = new DeployCommand(options);
  });

  afterEach(async function() {
    await tmp.teardown(tmpPath);
    await gitServer.close();
  });

  this.timeout(10000);

  it('deploys successfully when not yet set up', async function() {
    await userConfig.append(userInfo);
    await command.run(options, ['development']);

    // output looks like:
    // [new tag]         deploy-development-2018-4-26-17-44-44 -> deploy-development-2018-4-26-17-44-44
    expect(ui.errors).to.match(/new tag/);
    const tag = ui.errors.replace(/\n/g, '').match(/([^\s]+)$/)[0];
    expect(tag).to.match(/^deploy-development-/);

    expect(await gitServer.files(tag)).to.contain('README.md');
    await execa('git', ['fetch', 'deploy-development']);
    expect(await execa.stdout('git', ['config', '--get', 'remote.deploy-development.fetch'])).to.eq('+refs/notes/*:refs/notes/*');
  });

  it('fails deploys to nonexistent environment', async function() {
    await command
      .run(options, ['foobar'])
      .then(result => {
        throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
      })
      .catch(e => {
        expect(e.message).to.match(/Usage: movable deploy/);
      });
  });

  it('deploys successfully when valid remote already exists', async function() {
    await execa('git', [
      'remote',
      'add',
      'deploy-development',
      `http://${userInfo.auth.token.access_token}@localhost:14902/my-co/foo.git`
    ]);

    await command.run(options, ['development']);
    expect(ui.errors).to.match(/new tag/);
    const tag = ui.errors.replace(/\n/g, '').match(/([^\s]+)$/)[0];
    expect(tag).to.match(/^deploy-development-/);

    expect(await gitServer.files(tag)).to.contain('README.md');
  });

  it('deploys successfully when expired remote exists and user is authenticated', async function() {
    await userConfig.append(userInfo);
    await execa('git', [
      'remote',
      'add',
      'deploy-development',
      `http://expired-token@localhost:14902/my-co/foo.git`
    ]);

    await command.run(options, ['development']);

    expect(ui.errors).to.match(/new tag/);
    const tag = ui.errors.replace(/\n/g, '').match(/([^\s]+)$/)[0];
    expect(tag).to.match(/^deploy-development-/);

    expect(await gitServer.files(tag)).to.contain('README.md');
  });

  it('fails when expired remote exists and user is not authenticated', async function() {
    await execa('git', [
      'remote',
      'add',
      'deploy-development',
      `http://expired-token@localhost:14902/my-co/foo.git`
    ]);

    await command
      .run(options, ['development'])
      .then(result => {
        throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
      })
      .catch(e => {
        expect(e.message).to.eq(
          'Error refreshing access token: Problem authenticating, run `movable login`.'
        );
      });
  });

  it('fails when company slug does not exist', async function() {
    await userConfig.append(userInfo);
    await execa('git', [
      'remote',
      'add',
      'deploy-development',
      `http://${userInfo.auth.token.access_token}@localhost:14902/bad-co/bad.git`
    ]);

    await command
      .run(options, ['development'])
      .then(result => {
        throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
      })
      .catch(e => {
        expect(e.message).to.match(/Command failed: git push deploy-development deploy-development-\d+/);
        expect(e.message).to.match(/not found/);
      });
  });

  it('fails when user is not logged in', async function() {
    await command
      .run(options, ['development'])
      .then(result => {
        throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
      })
      .catch(e => {
        expect(e.message).to.eq(
          'Error refreshing access token: Problem authenticating, run `movable login`.'
        );
      });
  });
});
