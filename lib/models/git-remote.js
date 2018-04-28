'use strict';

/**
@module movable-cli
*/

const execa = require('execa');
const url = require('url');

const remotes = {
  development: 'http://localhost:4044',
  staging: 'https://repos.movableink.com',
  production: 'https://repos.movableink.com'
};

/**
 * GitRemote manages a remote for a git repository.
 *
 * @class GitRemote
 * @extends CoreObject
 * @constructor
 **/
class GitRemote {
  constructor(opts) {
    this.environment = opts.environment;
    this.name = `deploy-${this.environment}`;
    this.baseURL = opts.remoteURL || remotes[opts.environment];
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

  /**
    Creates a new remote in the project's .git/config. Additionally, it sets up
    local refs/notes to track the remote's refs/notes, so that `git fetch remote`
    will sync the remote's refs/notes, for build logs.

    @public
    @method add
  */
  // create a new remote in project's .git/config
  async add() {
    await this.git('remote', 'add', this.name, this.toString());
    return this.git('config', '--add',
                    `remote.${this.name}.fetch`,
                    '+refs/notes/*:refs/notes/*');
  }

  /**
    Ensure that the remote repository exists and that we can access it. Returns false
    in the event of an error.

    @public
    @method check
  */
  // ensure that the remote repository exists and that we can access it
  check() {
    return this.git('fetch', this.name)
      .then(() => true)
      .catch(() => false);
  }

  /**
    Check .git/config to see if a remote with our name already exists

    @public
    @method getExisting
  */
  getExisting() {
    return this.git('remote', 'get-url', this.name)
      .then(result => result.stdout)
      .catch(_e => null);
  }

  /**
    Wrapper around using execa to call `git`. Disables git input, for the event
    where the http basic auth is incorrect we don't want to display a password
    prompt.

    @private
    @method git
  */
  git(...args) {
    // prevent git from showing password prompt
    const env = Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: 0 });
    return execa('git', args, { stdin: 'ignore', env });
  }

  /**
    Generate a unique deploy tag name, based on the environment and a timestamp.

    @public
    @method makeDeployId
  */
  makeDeployId() {
    const timestamp = new Date().toLocaleString().replace(/\s|:/g, '-');
    return `${this.name}-${timestamp}`;
  }

  /**
    Tags the current git commit with a new tag, returning the tag name.

    @public
    @method createTag
  */
  createTag() {
    const tagName = this.makeDeployId();
    return this.git('tag', '-a', '-m', tagName, tagName).then(() => tagName);
  }

  /**
    Pushes a tag (or any ref) to our remote.

    @public
    @method push
  */
  push(tagName) {
    return this.git('push', this.name, tagName);
  }

  /**
    Returns our remote, formatted as a URL string.

    @public
    @method toString
  */
  toString() {
    return this.uri.format();
  }

  /**
    Whether this remote's environment is in the list of valid environments.

    @public
    @method validEnvironment
  */
  validEnvironment() {
    return !!remotes[this.environment];
  }

  /**
    Update the url for an existing remote in .git/config.

    @public
    @method update
  */
  update() {
    return this.git('remote', 'set-url', this.name, this.toString());
  }

  /**
    List of all supported environments.

    @public
    @method environments
  */
  static environments() {
    return Object.keys(remotes);
  }
}

module.exports = GitRemote;
