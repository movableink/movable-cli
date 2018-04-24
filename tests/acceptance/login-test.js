'use strict';

const qs = require('qs');
const os = require('os');
const path = require('path');
const url = require('url');
const http = require('http');

const co = require('co');
const MockUI = require('console-ui/mock');
const td = require('testdouble');
const expect = require('chai').expect;
const request = require('request');
const nock = require('nock');
const Promise = require("rsvp").Promise;

const LoginCommand = require('../../lib/commands/login');
const LoginTask = require('../../lib/tasks/login');
const Command = require('../../lib/models/command');
const commandOptions = require('../factories/command-options');
const requireAsHash = require('ember-cli/lib/utilities/require-as-hash');
const Config = require('../../lib/models/config');

var mochaAsync = (fn) => {
    return async (done) => {
        try {
            await fn();
            done();
        } catch (err) {
            done(err);
        }
    };
};

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

const userInfo = {
  "user": {
    "id": 1,
    "email": "foo@example.com"
  },
  "companies": [{
    "id": 1,
    "name": "MyCo",
    "slug": "my-co"
  }]
};

const codeQuery = qs.stringify({ code: 'authorization code' });
const authTokenQuery = qs.stringify({
  code: 'authorization code',
  redirect_uri: oauthConfig.callbackURL,
  scope: 'mdk',
  grant_type: 'authorization_code',
  client_id: oauthConfig.client.id,
  client_secret: oauthConfig.client.secret
});

function startExistingWebserver() {
  return new Promise((resolve, reject) => {
    const existingServer = http.createServer(function(req, res) {});
    existingServer.listen(14942, '127.0.0.1', function(err) {
      err ? reject(err) : resolve(existingServer);
    });
  });
}

function stopExistingWebserver(server) {
  server.close();
  return new Promise((resolve, _reject) => {
    server.on('close', resolve);
  });
}

function openPrintedLink(ui, td) {
  return new Promise((resolve, reject) => {
    td.when(ui.writeLine(td.matchers.contains('Open this url'))).thenDo(function() {
      try {
        const msg = arguments[0];
        const loginUrl = msg.match(/\u001b\[4m\u001b\[34m(.*?)\u001b\[39m/)[1];

        request.get(loginUrl, function(error, response, body) {
          error ? reject(error) : resolve({ response, body });
        });
      } catch(e) {
        reject(e);
      }
    });
  });
}

describe('Acceptance: movable login', function() {
  let options, command, ui, authStub, apiStub, userConfig;

  beforeEach(function() {
    userConfig = new Config(path.join(os.tmpdir(), '.mdk'));
    ui = new MockUI();
    td.replace(ui, 'writeLine');
    options = commandOptions({
      commands: {
        Login: LoginCommand
      },
      tasks: {
        Login: LoginTask
      },
      ui,
      project: {
        isEmberCLIProject: () => false
      },
      oauth: oauthConfig,
      dashboardUrl: 'https://api-server.org',
      userConfig
    });

    command = new LoginCommand(options);
  });

  afterEach(function() {
    td.reset();
  });

  this.timeout(10000);

  it('user logs in a user successfully', async function() {
    authStub = nock('https://authorization-server.org')
      .get('/oauth/authorize')
      .query({
        response_type: 'code',
        client_id: oauthConfig.client.id,
        redirect_uri: oauthConfig.callbackURL,
        scope: 'mdk'
      })
      .reply(function(uri, requestBody) {
        const query = url.parse(uri, true).query;
        return [
          302,
          '',
          { Location: `${query.redirect_uri}?${codeQuery}` }
        ];
      })
      .post('/oauth/token', authTokenQuery)
      .reply(200, accessToken);

    apiStub = nock('https://api-server.org')
      .get('/user/info')
      .reply(200, JSON.stringify(userInfo));

    openPrintedLink(ui, td).then(({ response, body }) => {
      expect(response.statusCode).to.eq(200);
      expect(body).to.match(/Success/);
    });

    await command.run(options, []);

    const config = await userConfig.read();
    expect(config.user.email).to.eq(userInfo.user.email);
    expect(config.company.slug).to.eq(userInfo.companies[0].slug);
    expect(config.auth.token.access_token).to.eq(accessToken.access_token);
  });

  it('fails when webserver already running on login port', async function() {
    const server = await startExistingWebserver();

    await command.run(options, []).then(result => {
       throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
     }).catch(e => {
       expect(e.message).to.match(/listen EADDRINUSE/);
     }).finally(() => {
       return server.close();
     });
  });

  it('fails when user rejects oauth confirmation', async function() {
    authStub = nock('https://authorization-server.org')
      .get('/oauth/authorize')
      .query({
        response_type: 'code',
        client_id: oauthConfig.client.id,
        redirect_uri: oauthConfig.callbackURL,
        scope: 'mdk'
      })
      .reply(function(uri, requestBody) {
        const query = url.parse(uri, true).query;
        return [
          302,
          '',
          { Location: `${query.redirect_uri}?error=access_denied` }
        ];
      });

    openPrintedLink(ui, td).then((response, body) => {
      expect(response.statusCode).to.eq(200);
      expect(body).to.match(/Failed/);
    });

    await command.run(options, []).then(result => {
      throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
    }).catch(e => {
      expect(e.message).to.eq('User rejected oAuth request');
    });
  });
});
