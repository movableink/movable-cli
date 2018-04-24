const url = require('url');
const OAuth = require('../o-auth');
const Config = require('../config');
const defaults = require('../../defaults');

exports.login = function() {
  return function(req, res) {
    const callbackURL = `http://${req.headers.host}/dev/oauth/callback`;
    const oauthOpts = Object.assign({}, defaults.oauth, { callbackURL });
    const oauth = new OAuth(oauthOpts);

    res.redirect(oauth.authURL);
  };
};

exports.logout = function() {
  return async function logout(req, res) {
    const userConfig = new Config(defaults.userConfigPath);
    await userConfig.append({ user: undefined, company: undefined, auth: undefined });

    res.statusCode = 204;
    res.end();
  };
};

exports.callback = function() {
  return async function(req, res) {
    const callbackURL = `http://${req.headers.host}/dev/oauth/callback`;
    const oauthOpts = Object.assign({}, defaults.oauth, { callbackURL });
    const oauth = new OAuth(oauthOpts);

    const uri = url.parse(req.url, true);
    const error = uri.query.error;

    if (error) {
      res.end('There was a problem authenticating');
      return;
    }

    const userConfig = new Config(defaults.userConfigPath);

    const code = uri.query.code;
    const auth = await oauth.accessTokenFromCode(code).catch(e => {
      return res.end('Could not authorize user');
    });

    await userConfig.append({ auth });

    res.redirect('/dev/user');
  };
};
