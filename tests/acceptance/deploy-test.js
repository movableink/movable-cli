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

// Why have same path for every test, rather than creating random
// temp directories? Because the Project model will return a singleton
// so there is no way to instantiate a second Project with a different
// directory.
let tmpPath = path.join(process.cwd(), 'tmp', 'deploy-test');

const oauthConfig = {
  "client": {
    "id": "the client id",
    "secret": "the client secret"
  },
  "auth": {
    "tokenHost": "https://authorization-server.org"
  },
  callbackURL: 'http://localhost:14942/oauth/callback',
  scope: 'mdk'
};

const apiConfig = {
  host: 'api-server.org',
  protocol: 'https'
};

const accessToken = {
  "access_token": "5683E74C-7514-4426-B64F-CF0C24223F69",
  "refresh_token": "8D175C5F-AE24-4333-8795-332B3BDA8FE3",
  "token_type": "bearer",
  "expires_in": "240000"
};

// Data for ~/.mdk
const userInfo = {
  "auth": {
    "token": {
      access_token: accessToken.access_token,
      refresh_token: accessToken.refresh_token,
      token_type: accessToken.token_type,
      expires_in: accessToken.expires_in,
      created_at: (new Date().getTime()),
      expires_at: (new Date(new Date().getTime() + parseInt(accessToken.expires_in)))
    }
  },
  "user": {
    "id": 1,
    "email": "foo@example.com"
  },
  "company": {
    "id": 1,
    "name": "MyCo",
    "slug": "my-co"
  }
};

const userResponse = Object.assign({}, userInfo, { companies: [userInfo.company] });

describe('Acceptance: movable deploy', function() {
  let options, command, ui, userConfig, gitServer;

  beforeEach(async function() {
    await tmp.setup(tmpPath);
    process.chdir(tmpPath);

    await movable(['init',
                   '--name',
                   'foo',
                   '--skip-npm',
                   '--no-skip-git'],
                  { skipGit: false });

    const remoteGitDir = path.join(tmpPath, 'remote');
    gitServer = new GitServer(remoteGitDir,
                              userInfo.auth.token.access_token,
                              '/my-co/foo.git');
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
      api: apiConfig,
      userConfig,
      remoteUrl: 'http://localhost:14902'
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

    expect(await gitServer.files()).to.contain('README.md');
  });

  it('fails deploys to nonexistent environment', async function() {
    await command.run(options, ['foobar']).then(result => {
      throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
    }).catch(e => {
      expect(e.message).to.match(/Usage: movable deploy/);
    });
  });

  it('deploys successfully when valid remote already exists', async function() {
    await execa('git', ['remote', 'add', 'deploy-development',
                        `http://${userInfo.auth.token.access_token}@localhost:14902/my-co/foo.git`]);

    await command.run(options, ['development']);

    expect(await gitServer.files()).to.contain('README.md');
  });

  it('deploys successfully when expired remote exists and user is authenticated', async function() {
    await userConfig.append(userInfo);
    await execa('git', ['remote', 'add', 'deploy-development',
                        `http://expired-token@localhost:14902/my-co/foo.git`]);

    await command.run(options, ['development']);

    expect(await gitServer.files()).to.contain('README.md');
  });

  it('fails when expired remote exists and user is not authenticated', async function() {
    await execa('git', ['remote', 'add', 'deploy-development',
                        `http://expired-token@localhost:14902/my-co/foo.git`]);

    await command.run(options, ['development']).then(result => {
      throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
    }).catch(e => {
      expect(e.message).to.eq('Problem authenticating, run `movable login`.');
    });
  });

  it('fails when company slug does not exist', async function() {
    await userConfig.append(userInfo);
    await execa('git', ['remote', 'add', 'deploy-development',
                        `http://${userInfo.auth.token.access_token}@localhost:14902/bad-co/bad.git`]);

    await command.run(options, ['development']).then(result => {
      throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
    }).catch(e => {
      expect(e.message).to.match(/Command failed: git push deploy-development/);
      expect(e.message).to.match(/not found/);
    });
  });

  it('fails when user is not logged in', async function() {
    await command.run(options, ['development']).then(result => {
      throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
    }).catch(e => {
      expect(e.message).to.eq('Problem authenticating, run `movable login`.');
    });
  });
});
