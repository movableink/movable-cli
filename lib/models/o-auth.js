const express = require('express');
const url = require('url');
const simpleOAuth2 = require('simple-oauth2');
const SilentError = require('silent-error');
const Promise = require("rsvp").Promise;

class OAuth {
  constructor(opts={}) {
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

  startServer() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, (err) => {
        err ? reject(err) : resolve(this.server);
      });
      this.server.once('error', reject);
    });
  }

  stopServer() {
    this.server && this.server.close();
  }

  async accessTokenFromCode(code) {
    const tokenConfig = {
      code,
      redirect_uri: this.opts.callbackURL,
      scope: this.opts.scope
    };

    const result = await this.oauth2.authorizationCode.getToken(tokenConfig);
    return this.oauth2.accessToken.create(result);
  }

  async ensureValidAccessToken(token) {
    let accessToken = this.oauth2.accessToken.create(token);

    if (accessToken.expired()) {
      return await accessToken.refresh();
    }

    return accessToken;
  }

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
          res.status(200).end("Success! You may now close this window.");
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

  get loginURL() {
    const uri = url.parse(this.opts.callbackURL);
    uri.pathname = '/login';
    return uri.format();
  }

  get authURL() {
    return this.oauth2.authorizationCode.authorizeURL({
      redirect_uri: this.opts.callbackURL,
      scope: this.opts.scope
    });
  }
}

module.exports = OAuth;
