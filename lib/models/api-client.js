const url = require('url');
const request = require('request');
const OAuth = require('./o-auth');
const Promise = require("rsvp").Promise;

class ApiClient {
  constructor(opts) {
    this.oauth = new OAuth(opts.oauth);
    this.userConfig = opts.userConfig;
    this.dashboardUrl = opts.dashboardUrl;
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

    return validToken.token;
  }

  async get(getURL) {
    const uri = url.parse(getURL);
    const dashboardUri = url.parse(this.dashboardUrl);

    if(!uri.host) {
      uri.host = dashboardUri.host;
      uri.protocol = dashboardUri.protocol;
    }

    this.accessToken = await this.getAccessToken();

    return new Promise((resolve, reject) => {
      request.get({
        url: uri.format(),
        auth: {
          bearer: this.accessToken.access_token
        }
      }, function(error, response, body) {
        if(error) {
          reject(error);
        } else if(response.statusCode > 399) {
          reject(new Error(`Server returned status code ${response.statusCode} for ${uri.format()}`));
        } else {
          resolve(body);
        }
      });
    });
  }

  async refreshUserInfo() {
    const data = await this.get('/user/info');
    let userInfo;
    try {
      userInfo = JSON.parse(data);
    } catch(e) {
      throw new Error(`Error parsing response for /user/info`);
    }

    if(userInfo && userInfo.user && userInfo.companies[0]) {
      const user = userInfo.user;
      const companyId = userInfo.user.company_id;
      const company = userInfo.companies.find(c => c.id === companyId);

      return await this.userConfig.append({
        auth: {
          token: this.accessToken,
          sorcerer: user.sorcerer_auth_token
        },
        user: {
          id: user.id,
          email: user.email,
          features: (user.features || {}),
          company_id: user.company_id
        },
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          products: company.products
        },
        updated: new Date()
      });
    } else {
      throw(new Error('There was a problem authenticating'));
    }
  }
}

module.exports = ApiClient;
