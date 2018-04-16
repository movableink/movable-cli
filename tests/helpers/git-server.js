const url = require('url');
const express = require('express');
const execa = require('execa');
const fs = require('fs-extra');
const RSVP = require('rsvp');
const remove = RSVP.denodeify(fs.remove);
const mkdir = RSVP.denodeify(fs.mkdir);

class GitServer {
  constructor(path, requiredToken, repoPath) {
    this.gitDir = path;
    this.app = express();

    this.app.use((req, res, next) => {
      const auth = req.headers.authorization;

      if(!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="gitd"');
        res.end('401 Unauthorized');
        return;
      }

      const [ basic, encoded ] = auth.split(' ');
      const decoded = new Buffer(encoded, 'base64').toString();
      const [ username, _password ] = decoded.split(':');

      if(username === requiredToken) {
        next();
      } else {
        res.statusCode = 401;
        res.end('401 Unauthorized');
      }
    });

    this.app.post(`${repoPath}/create`, function(req, res) {
      res.end();
    });

    this.app.post(`${repoPath}/git-upload-pack`, (req, res) => {
      res.setHeader('content-type', 'application/x-git-upload-pack-result');
      const bin = execa('git-upload-pack', ['--stateless-rpc', this.gitDir]);
      req.pipe(bin.stdin);
      bin.stdout.pipe(res);
    });

    this.app.post(`${repoPath}/git-receive-pack`, (req, res) => {
      res.setHeader('content-type', 'application/x-git-receive-pack-result');

      const bin = execa('git-receive-pack', ['--stateless-rpc', this.gitDir]);
      req.pipe(bin.stdin);
      bin.stdout.pipe(res);
    });

    this.app.get(`${repoPath}/info/refs`, (req, res) => {
      const { service } = url.parse(req.url, true).query;

      if(['git-receive-pack', 'git-upload-pack'].indexOf(service) < 0) {
        res.statusCode = 400;
        res.end();
        return;
      }

      res.setHeader('Content-Type', `application/x-${service}-advertisement`);

      const line = `# service=${service}\n`;
      const len = ('0000' + (line.length + 4).toString(16)).substr(-4, 4);
      res.write(len + line + '0000');

      const bin = execa(service, ['--stateless-rpc', '--advertise-refs', this.gitDir]);
      req.pipe(bin.stdin);
      bin.stdout.pipe(res);
    });
  }

  async initialize() {
    await remove(this.gitDir);
    await mkdir(this.gitDir);
    return execa('git', ['init', '--bare', this.gitDir]);
  }

  async files() {
    const list = await execa.stdout('git', ['ls-tree', '--name-only', 'development'], {
      cwd: this.gitDir
    });
    return list.split("\n");
  }

  listen(port) {
    return new Promise((resolve, reject) => {
      this._server = this.app.listen(port, (err) => {
        err ? reject(err) : resolve(this);
      });
      this._server.once('error', (err) => reject(err));
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if(!this._server) { resolve(); }
      this._server.once('close', resolve);
      this._server.close();
    });
  }
}

module.exports = GitServer;
