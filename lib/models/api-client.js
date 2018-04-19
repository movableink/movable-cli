const url = require('url');
const request = require('request');
const OAuth = require('./o-auth');
const Promise = require("rsvp").Promise;

class ApiClient {
  constructor(opts) {
    this.oauth = new OAuth(opts.oauth);
    this.userConfig = opts.userConfig;
    this.defaultUri = opts.api;
  }

  async getConfig() {
    try {
      return await this.userConfig.read();
    } catch(e) {
      throw("Missing config, try running `movable login`");
    }
  }

  async getAccessToken() {
    const userConfig = await this.getConfig();
    const validToken = await this.oauth.ensureValidAccessToken(userConfig.auth.token);

    if(validToken.token !== userConfig.auth.token) {
      await this.userConfig.append({ auth: validToken });
    }

    return validToken;
  }

  async get(getURL) {
    const uri = url.parse(getURL);

    if(!uri.host) {
      uri.host = this.defaultUri.host;
      uri.protocol = this.defaultUri.protocol;
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

      return await this.userConfig.append({
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
