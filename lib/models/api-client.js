const simpleOAuth2 = require('simple-oauth2');
const creds = require('../creds');
const url = require('url');
const request = require('request');

const oauth2 = simpleOAuth2.create(creds);

const uriDefaults = {
  host: 'movableink.localhost:3000',
  protocol: 'http'
};

class ApiClient {
  constructor(config) {
    this.config = config;
  }

  getConfig() {
    return this.config.read();
  }

  async getAccessToken() {
    let accessToken;
    try {
      const config = await this.getConfig();
      accessToken = oauth2.accessToken.create(config.auth.token);
    } catch (error) {
      console.log('Missing config, try `movable login` again');
    }

    if (accessToken.expired()) {
      try {
        accessToken = await accessToken.refresh();
      } catch (error) {
        console.log('Error refreshing access token: ', error.message);
      }
    }

    return accessToken;
  }

  async get(getURL) {
    const uri = url.parse(getURL);

    if(!uri.host) {
      uri.host = uriDefaults.host;
      uri.protocol = uriDefaults.protocol;
    }

    this.accessToken = await this.getAccessToken();
    const token = this.accessToken.token;

    return new Promise((resolve, reject) => {
      request.get({
        url: uri.format(),
        auth: {
          bearer: token.access_token
        }
      }, function(error, response, body) {
        if(error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }

  async refreshUserInfo() {
    const data = await this.get('/user/info');
    const userInfo = JSON.parse(data);

    if(userInfo && userInfo.user && userInfo.companies[0]) {
      const user = userInfo.user;
      const company = userInfo.companies[0];

      return await this.config.append({
        auth: this.accessToken,
        user: {
          id: user.id,
          email: user.email
        },
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug
        }
      });
    } else {
      throw(new Error('There was a problem authenticating'));
    }
  }
}

module.exports = ApiClient;
