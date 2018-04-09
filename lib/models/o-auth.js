const express = require('express');
const url = require('url');
const simpleOAuth2 = require('simple-oauth2');
const creds = require('../creds');

const oauth2 = simpleOAuth2.create(creds);

const defaultOpts = {
  callbackURL: 'http://localhost:14943/oauth/callback',
  scope: 'mdk'
};

class OAuth {
  constructor(opts={}) {
    this.opts = Object.assign({}, defaultOpts, opts);

    const { path, port, hostname } = url.parse(this.opts.callbackURL);
    this.callbackPath = path;
    this.port = port;
    this.host = hostname;

    this.app = express();
  }

  startServer() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, (err) => {
        err ? reject(err) : resolve(this.server);
      });
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

    const result = await oauth2.authorizationCode.getToken(tokenConfig);
    return oauth2.accessToken.create(result);
  }

  waitForCallback() {
    return new Promise((resolve, reject) => {
      this.app.use((req, res, next) => {
        const uri = url.parse(req.url, true);
        if (uri.pathname === this.callbackPath) {
          const code = uri.query.code;
          res.writeHead(200, {});
          res.end("Success! You may now close this window.");
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
    return oauth2.authorizationCode.authorizeURL({
      redirect_uri: this.opts.callbackURL,
      scope: this.opts.scope
    });
  }
}

module.exports = OAuth;
