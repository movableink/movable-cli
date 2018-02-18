'use strict';

const path = require('path');
const execa = require('execa');
const SilentError = require('silent-error');

// todo: convert ruby script to js to remove the ruby dependency
const localDeployScript = path.join(__dirname,
                                    '..', '..',
                                    'bin', 'push-dev-cartridge');

const deployments = {
  development: ['ruby', [localDeployScript]],
  staging: ['git', ['push', 'deploy', 'HEAD:staging']],
  production: ['git', ['push', 'deploy', 'HEAD:production']]
};

const Task = require('../models/task');

class DeployTask extends Task {
  run(options) {
    let ui = this.ui;

    const deployment = deployments[options.environment];
    if(!deployment) {
      let msg = "Usage: movable deploy <environment>";
      msg += `\n\nEnvironments: ${Object.keys(deployments).join(', ')}`;
      return Promise.reject(new SilentError(msg));
    }

    execa('git', ['remote', 'get-url', 'deploy']).catch((e) => {
      const msg = "Problem pushing, have you already run ./bin/setup-deploy?";
      return Promise.reject(new SilentError(msg));
    }).then(() => {
      const proc = execa(...deployment);

      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);

      return proc;
    }).then(() => {
      ui.writeLine('deployed to development');
    }).catch((e) => {
      ui.writeLine('deployment failed');
    });
  }
}

module.exports = DeployTask;
