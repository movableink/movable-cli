'use strict';

const expect = require('chai').expect;
const td = require('testdouble');
const nock = require('nock');
const qs = require('querystring');
const url = require('url');

const ApiClient = require('../../../lib/models/api-client');
const Config = require('../../../lib/models/config');
const { userInfo, accessToken } = require('../../helpers/user-info');

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

const authTokenQuery = qs.stringify({
  grant_type: 'refresh_token',
  refresh_token: accessToken.refresh_token,
  client_id: oauthConfig.client.id,
  client_secret: oauthConfig.client.secret
});

describe('models/api-client-test', function() {
  let apiClient, MockConfig;

  beforeEach(function() {
    MockConfig = td.constructor(Config);

    apiClient = new ApiClient({
      oauth: oauthConfig,
      userConfig: new MockConfig(),
      dashboardUrl: 'https://api-server.org'
    });
  });

  describe('#getAccessToken', function() {
    it('returns a valid token when existing token is good', async function() {
      td.when(MockConfig.prototype.read()).thenResolve(userInfo);
      const token = await apiClient.getAccessToken();
      expect(token.access_token).to.eq(userInfo.auth.token.access_token);
    });

    it('returns a valid token when existing access token is stale', async function() {
      const staleUserInfo = JSON.parse(JSON.stringify(userInfo));
      staleUserInfo.auth.token.expires_in = -1000;
      staleUserInfo.auth.token.expires_at = new Date(new Date() - 1000);

      td.when(MockConfig.prototype.read()).thenResolve(staleUserInfo);
      td.when(MockConfig.prototype.append(td.matchers.anything())).thenDo(function(data) {
        expect(data.auth.token.token_type).to.eq('bearer');
      });

      const authStub = nock('https://authorization-server.org')
            .post('/oauth/token', authTokenQuery)
            .reply(200, accessToken);

      const token = await apiClient.getAccessToken();

      expect(token.token_type).to.eq('bearer');
      expect(token.expires_in).to.eq('240000');
      expect(token.expires_at).not.to.eq(accessToken.expires_at);
    });

    it('rejects when existing access token is invalid', async function() {
      td.when(MockConfig.prototype.read()).thenReject(new Error('failure'));

      const authStub = nock('https://authorization-server.org')
            .post('/oauth/token', authTokenQuery)
            .reply(200, accessToken);

      apiClient.getAccessToken().then(() => {
        throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
      }).catch(e => {
        expect(e.message).to.eq('failure');
      });
    });

    it('updates the user config with new access token', function() {

    });
  });

  describe('#get', function() {
    it('fetches data successfully');
    it('rejects when api returns 4xx/5xx');
    it('rejects when api fails');
    it('defaults to dashboard host');
  });

  describe('#refreshUserInfo', function() {
    it('throws when API returns non-json');
    it('throws when API returns wrong json');
    it('updates user config file');
  });
});
