const url = require('url');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../lib/server/index');
const Config = require('../../lib/models/config');
const defaultConfig = require('../../lib/defaults');
const nock = require('nock');

defaultConfig.userConfigPath = './tmp/.mdk';
defaultConfig.dashboardURL = 'http://dashboard.invalid';
defaultConfig.oauth.client = { id: '1234', secret: '5678' };
defaultConfig.oauth.auth = { tokenHost: 'http://dashboard.invalid/oauth/authorize' };
defaultConfig.deployURL = 'http://repos.invalid';

const userConfig = new Config(defaultConfig.userConfigPath);

const token = {
  access_token: '12345',
  token_type: 'bearer',
  expires_in: 7200,
  refresh_token: '67890',
  scope: 'mdk'
};

const accessToken = {
  access_token: 'fffffff',
  refresh_token: 'rrrrrrrr',
  token_type: 'bearer',
  expires_in: '7200'
};

chai.use(chaiHttp);
const { expect } = chai;

const app = server('tmp', 9999);

describe('Acceptance: server/font-api', function() {
  beforeEach(async function() {
    await userConfig.append({ auth: { token } });
  });

  it('returns fonts from the server when available', async function() {
    const customFonts = [
      { id: 1, family: 'Roboto', webfont_url: 'https://example.com/roboto.woff' },
      { id: 1, family: 'Libre', webfont_url: 'https://example.com/libre.woff' }
    ];

    nock('http://dashboard.invalid')
      .get('/oauth/authorize')
      .reply(function(uri, requestBody) {
        const query = url.parse(uri, true).query;
        return [302, '', { Location: `${query.redirect_uri}?code=auth%20code` }];
      })
      .post('/oauth/token')
      .reply(200, {})
      .get('/api/v2/custom_fonts')
      .reply(200, JSON.stringify({ custom_fonts: customFonts }));

    const res = await chai.request(app).get('/api/canvas/custom_fonts');

    expect(res.body).to.deep.equal({ custom_fonts: customFonts });
  });

  it('returns an empty array when user is not logged in', async function() {
    nock('http://dashboard.invalid')
      .get('/api/v2/custom_fonts')
      .reply(403, JSON.stringify({ error: 'not authorized' }));

    const res = await chai.request(app).get('/api/canvas/custom_fonts');

    expect(res).to.have.status(200);
    expect(res.text).to.eq('{"custom_fonts":[]}');
  });

  it('returns an empty array when server cannot be reached', async function() {
    nock('http://dashboard.invalid')
      .get('/oauth/authorize')
      .reply(function(uri, requestBody) {
        const query = url.parse(uri, true).query;
        return [302, '', { Location: `${query.redirect_uri}?code=auth%20code` }];
      })
      .post('/oauth/token')
      .reply(200, accessToken)
      .get('/api/v2/custom_fonts')
      .reply(500, JSON.stringify({ error: 'bad response' }));

    const res = await chai.request(app).get('/api/canvas/custom_fonts');

    expect(res).to.have.status(200);
    expect(res.text).to.eq('{"custom_fonts":[]}');
  });
});
