'use strict';

/**
@module movable-cli
*/

const express = require('express');
const url = require('url');
const simpleOAuth2 = require('simple-oauth2');
const SilentError = require('silent-error');
const Promise = require('rsvp').Promise;

/**
 * OAuth handles authentication with the Movable Ink Dashboard
 *
 * @class ApiClient
 * @extends CoreObject
 * @constructor
 **/
class OAuth {
  constructor(opts = {}) {
    this.opts = opts;

    const { path, port, hostname } = url.parse(this.opts.callbackURL);
    this.callbackPath = path;
    this.port = port;
    this.host = hostname;

    const oauthOpts = {
      client: opts.client,
      auth: opts.auth
    };
    this.oauth2 = simpleOAuth2.create(oauthOpts);
    this.app = express();
  }

  /**
    Start an http server that will handle the redirect from the oauth provider. Note
    that the server will not yet have any handlers; these are created by `waitForCallback()`.

    @public
    @method startServer
  */
  startServer() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, err => {
        err ? reject(err) : resolve(this.server);
      });
      this.server.once('error', reject);
    });
  }

  /**
    Stop the http server once the oauth process is complete.

    @public
    @method stopServer
  */
  stopServer() {
    this.server && this.server.close();
  }

  /**
    Exchange an authorization code for an access token

    @public
    @method accessTokenFromCode
  */
  async accessTokenFromCode(code) {
    const tokenConfig = {
      code,
      redirect_uri: this.opts.callbackURL,
      scope: this.opts.scope
    };

    const result = await this.oauth2.authorizationCode.getToken(tokenConfig);
    return this.oauth2.accessToken.create(result);
  }

  /**
    Checks the access token to ensure that it is valid, refreshing from refresh_token
    if it is expired.

    @public
    @method ensureValidAccessToken
  */
  async ensureValidAccessToken(token) {
    let accessToken = this.oauth2.accessToken.create(token);

    if (accessToken.expired()) {
      return await accessToken.refresh();
    }

    return accessToken;
  }

  /**
    This method is complicated. Returns a promise that adds a new route to the http
    server, where an http client hitting the callback route resolves the promise
    with the http client's `authorization_code`. As soon as the `authorization_code`
    is received, the route closes. Also adds a /login route to serve as a shortened
    URL to redirect to the oauth `authURL`.

    @public
    @method waitForCallback
  */
  waitForCallback() {
    return new Promise((resolve, reject) => {
      this.app.use((req, res, next) => {
        // prevent keep-alive so that server can exit immediately
        res.setHeader('connection', 'close');

        const uri = url.parse(req.url, true);
        if (uri.pathname === this.callbackPath) {
          const error = uri.query.error;
          if (error) {
            reject(new SilentError('User rejected oAuth request'));
            this.stopServer();
            return;
          }

          const code = uri.query.code;
          res.status(200).end('Success! You may now close this window.');
          resolve(code);

          this.stopServer();
        } else if (uri.pathname === '/login') {
          res.redirect(this.authURL);
        } else {
          next();
        }
      });
    });
  }

  /**
    Generates a /login URL that the user can click on to be redirected to the oauth
    `authURL`.

    @public
    @method loginURL
  */
  get loginURL() {
    const uri = url.parse(this.opts.callbackURL);
    uri.pathname = '/login';
    return uri.format();
  }

  /**
    Generates a URL for our oauth provider to allow the user to authenticate.

    @public
    @method authURL
  */
  get authURL() {
    return this.oauth2.authorizationCode.authorizeURL({
      redirect_uri: this.opts.callbackURL,
      scope: this.opts.scope
    });
  }
}

module.exports = OAuth;
