'use strict';

const expect = require('chai').expect;
const td = require('testdouble');

const GitRemote = require('../../../lib/models/git-remote');

describe('models/git-remote', function() {
  let remote;
  beforeEach(function() {
    remote = new GitRemote({ environment: 'development' });
    remote.git = td.func('git command');
  });

  it('sets the remote name', function() {
    expect(remote.name).to.eq('deploy-development');
  });

  describe('#baseURL', function() {
    it('sets the URI', function() {
      remote.baseURL = 'https://git-server.org/foo/bar.git';
      expect(remote.uri.hostname).to.eq('git-server.org');
    });
  });

  describe('#path', function() {
    it('sets the pathname', function() {
      remote.baseURL = 'https://git-server.org/foo/bar.git';
      remote.path = '/foo/asdf.git';
      expect(remote.toString()).to.eq('https://git-server.org/foo/asdf.git');
    });
  });

  describe('#token', function() {
    it('sets the uri auth', function() {
      remote.baseURL = 'https://git-server.org/foo/bar.git';
      remote.token = '12345';
      expect(remote.toString()).to.eq('https://12345@git-server.org/foo/bar.git');
    });
  });

  describe('#add', function() {
    it('adds a new remote', function() {
      remote.token = '12345';
      remote.path = '/foo/bar.git';

      const gitArgs = [
        'remote',
        'add',
        'deploy-development',
        'http://12345@localhost:4044/foo/bar.git'
      ];
      td.when(remote.git(...gitArgs)).thenResolve('it worked');

      const notesArgs = [
        'config',
        '--add',
        'remote.deploy-development.fetch',
        '+refs/notes/*:refs/notes/*'
      ];
      td.when(remote.git(...notesArgs)).thenResolve('it worked');

      return remote.add().then(function(result) {
        expect(result).to.eq('it worked');
      });
    });
  });

  describe('#check', function() {
    it('returns true when git remote is working', function() {
      const gitArgs = ['fetch', 'deploy-development'];
      td.when(remote.git(...gitArgs)).thenResolve('it worked');

      return remote.check().then(function(result) {
        expect(result).to.eq(true);
      });
    });

    it('returns false when git remote is nonexistent', async function() {
      const gitArgs = ['fetch', 'deploy-development'];
      td.when(remote.git(...gitArgs)).thenReject('it blew up');

      const result = await remote.check();
      expect(result).to.eq(false);
    });
  });

  describe('#getExisting', function() {
    it('returns the remote when it exists', async function() {
      const gitArgs = ['remote', 'get-url', 'deploy-development'];
      td
        .when(remote.git(...gitArgs))
        .thenResolve({ stdout: 'https://12345@git-server.org/foo/bar.git' });

      const result = await remote.getExisting();
      expect(result).to.eq('https://12345@git-server.org/foo/bar.git');
    });

    it('returns null when remote does not exist', async function() {
      const gitArgs = ['remote', 'get-url', 'deploy-development'];
      td.when(remote.git(...gitArgs)).thenReject('failed!');

      const result = await remote.getExisting();
      expect(result).to.eq(null);
    });
  });

  describe('#createTag', function() {
    it('creates a tag', async function() {
      const gitArgs = ['tag', td.matchers.contains(/^deploy-development-.*/)];
      td.when(remote.git(...gitArgs)).thenResolve('deploy-development-2018-05-02-10-04');

      const result = await remote.createTag();
      expect(result).to.match(/^deploy-development-/);
    });
  });

  describe('#push', function() {
    it('pushes tag to the remote', async function() {
      const gitArgs = ['push', 'deploy-development', 'deploy-development-2018-05-02-10-04'];
      td.when(remote.git(...gitArgs)).thenResolve('success');

      const result = await remote.push('deploy-development-2018-05-02-10-04');
      expect(result).to.eq('success');
    });
  });

  describe('#validEnvironment', function() {
    it('returns true when environment is one of the approved ones', function() {
      expect(remote.validEnvironment()).to.eq(true);
    });

    it('returns false for non-listed environments', function() {
      const badRemote = new GitRemote({ environment: 'bad' });
      expect(badRemote.validEnvironment()).to.eq(false);
    });
  });

  describe('#update', function() {
    it('sets the git remote to the uri', async function() {
      remote.baseURL = 'https://git-server.org/foo/bar.git';
      const gitArgs = [
        'remote',
        'set-url',
        'deploy-development',
        'https://git-server.org/foo/bar.git'
      ];
      td.when(remote.git(...gitArgs)).thenResolve('success');

      const result = await remote.update();
      expect(result).to.eq('success');
    });
  });
});
