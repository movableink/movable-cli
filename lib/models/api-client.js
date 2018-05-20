'use strict';

/**
@module movable-cli
*/

const url = require('url');
const request = require('request');
const OAuth = require('./o-auth');
const Promise = require('rsvp').Promise;

/**
 * ApiClient encapsulates communication with Movable Ink Dashboard API.
 *
 * @class ApiClient
 * @extends CoreObject
 * @constructor
 **/
class ApiClient {
  constructor(opts) {
    this.oauth = new OAuth(opts.oauth);
    this.userConfig = opts.userConfig;
    this.dashboardURL = opts.dashboardURL;
  }

  /**
    Get a valid access token, either returning the one we already have saved or
    getting a new one via the refresh_token if one is available.

    @private
    @method getAccessToken
  */
  async getAccessToken() {
    const userConfig = await this.userConfig.read();
    const validToken = await this.oauth.ensureValidAccessToken(userConfig.auth.token);

    if (validToken.token !== userConfig.auth.token) {
      await this.userConfig.append({ auth: validToken });
    }

    return validToken.token;
  }

  /**
    Makes a GET request to the API

    @public
    @method get
   */
  async get(getURL) {
    const uri = url.parse(getURL);
    const dashboardUri = url.parse(this.dashboardURL);

    if (!uri.host) {
      uri.host = dashboardUri.host;
      uri.protocol = dashboardUri.protocol;
    }

    this.accessToken = await this.getAccessToken();
    const auth = {
      bearer: this.accessToken.access_token
    };

    return new Promise((resolve, reject) => {
      request.get({ url: uri.format(), auth }, function(error, response, body) {
        if (error) {
          reject(error);
        } else if (response.statusCode > 399) {
          reject(
            new Error(`Server returned status code ${response.statusCode} for ${uri.format()}`)
          );
        } else {
          resolve(body);
        }
      });
    });
  }

  /**
    Fetches data about the user from /user/info and stores it in ~/.mdk

    @public
    @method refreshUserInfo
   */
  async refreshUserInfo() {
    const data = await this.get('/user/info');
    let userInfo;
    try {
      userInfo = JSON.parse(data);
    } catch (e) {
      throw new Error(`Error parsing response for /user/info`);
    }

    if (userInfo && userInfo.user && userInfo.companies[0]) {
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
          features: user.features || {},
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
      throw new Error('There was a problem authenticating');
    }
  }
}

module.exports = ApiClient;
