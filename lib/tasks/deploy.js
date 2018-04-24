'use strict';

const path = require('path');
const execa = require('execa');
const url = require('url');
const request = require('request');
const SilentError = require('silent-error');
const Config = require('../models/config');
const ApiClient = require('../models/api-client');
const GitRemote = require('../models/git-remote');
const Task = require('../models/task');

class DeployTask extends Task {
  async run(options) {
    let ui = this.ui;

    const remote = new GitRemote(options);

    if(!remote.validEnvironment()) {
      let msg = "Usage: movable deploy <environment>";
      msg += `\n\nEnvironments: ${GitRemote.environments().join(', ')}`;
      return Promise.reject(new SilentError(msg));
    }

    let existingRemoteURL = await remote.getExisting();
    if (existingRemoteURL) {
      remote.baseURL = existingRemoteURL;
    }

    const hasExistingValidRemote = existingRemoteURL && await remote.check();

    if (!hasExistingValidRemote) {
      const { auth, user, company } = await this.refreshUserInfo(options).catch(error => {
        throw new SilentError(`Error refreshing access token: ${error.message}`);
      });

      if (existingRemoteURL) {
        remote.token = auth.token.access_token;
        await remote.update();
      } else {
        // construct a remote path from our company slug + this repo name
        if (!company.slug) {
          const msg = ["Your company does not have an assigned slug, ",
                       "cannot automatically set up a deploy target"].join('');
          throw(new SilentError(msg));
        }

        const name = this.project.pkg.name;
        remote.path = `/${company.slug}/${name}.git`;
        remote.token = auth.token.access_token;

        // attempt to create the remote repository, it doesn't hurt anything
        // if it already exists for some reason
        await this.createRepository(remote.toString());
        await remote.add();
      }
    }

    const push = remote.push();

    push.stdout.pipe(ui.outputStream);
    push.stderr.pipe(ui.errorStream);

    await push;

    ui.writeLine(`deployed to ${remote.env}`);
  }

  refreshUserInfo(options) {
    const client = new ApiClient(options);
    return client.refreshUserInfo().catch(e => {
      const msg = "Problem authenticating, run `movable login`.";
      throw(new SilentError(msg));
    });
  }

  onInterrupt() {
    // Unfortunately the only way I can figure out how to make ctrl-c work
    // while waiting on something other than execa
    throw(new Error('interrupted'));
  }

  createRepository(repoURL) {
    return new Promise((resolve, reject) => {
      request.post({ url: `${repoURL}/create` }, function(err, response, body) {
        if(err) {
          reject(err);
        } else if(response.statusCode >= 400) {
          reject(new Error(`Could not create repository: ${response.body}`));
        } else {
          resolve(body);
        }
      });
    });
  }
}

module.exports = DeployTask;
