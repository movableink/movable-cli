const execa = require('execa');
const url = require('url');

const remoteNames = {
  development: 'local-deploy',
  staging: 'deploy',
  production: 'deploy'
};

const remotes = {
  development: 'http://localhost:4044',
  staging: 'https://git.movableink.com',
  production: 'https://git.movableink.com'
};

class GitRemote {
  constructor(env) {
    this.env = env;
    this.name = remoteNames[env];
    this.baseURL = remotes[env];
  }

  set baseURL(value) {
    this.uri = value && url.parse(value);
  }

  set path(value) {
    this.uri.pathname = value;
  }

  set token(value) {
    this.uri.auth = value;
  }

  // create a new remote in project's .git/config
  add() {
    return this.git('remote', 'add', this.name, this.toString());
  }

  // ensure that the remote repository exists and that we can access it
  check() {
    return this.git('fetch', this.name).then(() => true)
      .catch(() => false);
  }

  // check .git/config to see if a remote with our name already exists
  getExisting() {
    return this.git('remote', 'get-url', this.name)
      .then(result => result.stdout)
      .catch(_e => null);
  }

  git(...args) {
    // prevent git from showing password prompt
    const env = Object.assign({}, process.env, { 'GIT_TERMINAL_PROMPT': 0 });
    return execa('git', args, { stdin: 'ignore', env });
  }

  push(env=this.env) {
    return this.git('push', this.name, `HEAD:${env}`);
  }

  toString() {
    return this.uri.format();
  }

  validEnvironment() {
    return !!this.uri;
  }

  // update the url for an existing remote in .git/config
  update() {
    return this.git('remote', 'set-url', this.name, this.toString());
  }

  // supported environments
  static environments() {
    return Object.keys(remotes);
  }
}

module.exports = GitRemote;
