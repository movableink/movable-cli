const execa = require('execa');
const url = require('url');

const remotes = {
  development: 'http://localhost:4044',
  staging: 'https://repos.movableink.com',
  production: 'https://repos.movableink.com'
};

class GitRemote {
  constructor(opts) {
    this.environment = opts.environment;
    this.name = `deploy-${this.environment}`;
    this.baseURL = opts.remoteUrl || remotes[opts.environment];
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
  async add() {
    await this.git('remote', 'add', this.name, this.toString());
    return this.git('config', '--add',
                    `remote.${this.name}.fetch`,
                    '+refs/notes/*:refs/notes/*');
  }

  // ensure that the remote repository exists and that we can access it
  check() {
    return this.git('fetch', this.name)
      .then(() => true)
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
    const env = Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: 0 });
    return execa('git', args, { stdin: 'ignore', env });
  }

  makeDeployId() {
    const timestamp = new Date().toLocaleString().replace(/\s|:/g, '-');
    return `${this.name}-${timestamp}`;
  }

  createTag() {
    const tagName = this.makeDeployId();
    return this.git('tag', '-a', '-m', tagName, tagName).then(() => tagName);
  }

  push(tagName) {
    return this.git('push', this.name, tagName);
  }

  toString() {
    return this.uri.format();
  }

  validEnvironment() {
    return !!remotes[this.environment];
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
