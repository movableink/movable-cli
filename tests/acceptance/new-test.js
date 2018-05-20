'use strict';

const co = require('co');
const fs = require('fs-extra');
const movable = require('../helpers/movable');
const walkSync = require('walk-sync');
const Blueprint = require('ember-cli/lib/models/blueprint');
const path = require('path');
const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
let root = process.cwd();
const util = require('util');
const EOL = require('os').EOL;
const chalk = require('chalk');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;
const forEach = require('ember-cli-lodash-subset').forEach;
const assertVersionLock = require('ember-cli/tests/helpers/assert-version-lock');

let tmpDir = './tmp/new-test';

/* A lot of these are copied/modified from ember-cli/tests/acceptance/new-test.js */

describe('Acceptance: movable new', function() {
  this.timeout(10000);

  beforeEach(
    co.wrap(function*() {
      yield tmp.setup(tmpDir);
      process.chdir(tmpDir);
    })
  );

  afterEach(function() {
    return tmp.teardown(tmpDir);
  });

  function confirmBlueprintedForDir(dir) {
    let blueprintPath = path.join(root, dir, 'files');
    let expected = walkSync(blueprintPath);
    let actual = walkSync('.').sort();
    let directory = path.basename(process.cwd());

    forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
      expected[expected.indexOf(srcFile)] = destFile;
    });

    expected.sort();

    expect(directory).to.equal('foo');
    expect(expected).to.deep.equal(
      actual,
      `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`
    );
  }

  function confirmBlueprinted() {
    return confirmBlueprintedForDir('blueprints/app');
  }

  it(
    'movable new foo, where foo does not yet exist, works',
    co.wrap(function*() {
      yield movable(['new', 'foo', '--skip-npm', '--skip-bower']);

      confirmBlueprinted();
    })
  );

  it(
    'movable new with empty app name fails with a warning',
    co.wrap(function*() {
      let err = yield expect(movable(['new', ''])).to.be.rejected;

      expect(err.name).to.equal('SilentError');
      expect(err.message).to.contain('The `movable new` command requires a name to be specified.');
    })
  );

  it(
    'movable new without app name fails with a warning',
    co.wrap(function*() {
      let err = yield expect(movable(['new'])).to.be.rejected;

      expect(err.name).to.equal('SilentError');
      expect(err.message).to.contain('The `movable new` command requires a name to be specified.');
    })
  );

  it(
    'movable new with app name creates new directory and has a dasherized package name',
    co.wrap(function*() {
      yield movable(['new', 'FooApp', '--skip-npm', '--skip-bower', '--skip-git']);

      expect(dir('FooApp')).to.not.exist;
      expect(file('package.json')).to.exist;

      let pkgJson = fs.readJsonSync('package.json');
      expect(pkgJson.name).to.equal('foo-app');
    })
  );

  it(
    'Can create new movable project in an existing empty directory',
    co.wrap(function*() {
      fs.mkdirsSync('bar');

      yield movable(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar']);
    })
  );

  it(
    'Cannot create new movable project in a populated directory',
    co.wrap(function*() {
      fs.mkdirsSync('bar');
      fs.writeFileSync(path.join('bar', 'package.json'), '{}');

      let error = yield expect(
        movable(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar'])
      ).to.be.rejected;

      expect(error.name).to.equal('SilentError');
      expect(error.message).to.equal("Directory 'bar' already exists.");
    })
  );

  it(
    'Running movable new inside of movable-cli project automatically skips git',
    co.wrap(function*() {
      yield movable(['new', 'foo', '--skip-npm', '--skip-bower']);

      fs.mkdirSync('bar');
      process.chdir('bar');

      yield movable(['new', 'foo', '--skip-npm', '--skip-bower']);

      expect(dir('app')).to.not.be.empty;
      expect(dir('.git')).to.not.exist;

      confirmBlueprinted();
    })
  );

  it(
    'movable new uses yarn when blueprint has yarn.lock',
    co.wrap(function*() {
      fs.mkdirsSync('my_blueprint/files');
      fs.writeFileSync('my_blueprint/index.js', 'module.exports = {};');
      fs.writeFileSync(
        'my_blueprint/files/package.json',
        '{ "name": "foo", "dependencies": { "fs-extra": "*" }}'
      );
      fs.writeFileSync('my_blueprint/files/yarn.lock', '');

      yield movable(['new', 'foo', '--skip-git', '--blueprint=./my_blueprint']);

      expect(file('yarn.lock')).to.not.be.empty;
      expect(dir('node_modules/fs-extra')).to.not.be.empty;
    })
  );

  it(
    'movable new without skip-git flag creates .git dir',
    co.wrap(function*() {
      yield movable(['new', 'foo', '--skip-npm', '--skip-bower'], {
        skipGit: false
      });

      expect(dir('.git')).to.exist;
    })
  );

  it(
    'movable new cleans up after itself on error',
    co.wrap(function*() {
      fs.mkdirsSync('my_blueprint');
      fs.writeFileSync('my_blueprint/index.js', 'throw("this will break");');

      yield movable([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--blueprint=./my_blueprint'
      ]);

      expect(dir('foo')).to.not.exist;
    })
  );

  it(
    'movable new with --dry-run does not create new directory',
    co.wrap(function*() {
      yield movable(['new', 'foo', '--dry-run']);

      expect(process.cwd()).to.not.match(/foo/, 'does not change cwd to foo in a dry run');
      expect(dir('foo')).to.not.exist;
      expect(dir('.git')).to.not.exist;
    })
  );

  it(
    'movable new with --directory uses given directory name and has correct package name',
    co.wrap(function*() {
      let workdir = process.cwd();

      yield movable(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar']);

      expect(dir(path.join(workdir, 'foo'))).to.not.exist;
      expect(dir(path.join(workdir, 'bar'))).to.exist;

      let cwd = process.cwd();
      expect(cwd).to.not.match(/foo/, 'does not use app name for directory name');
      expect(cwd).to.match(/bar/, 'uses given directory name');

      let pkgJson = fs.readJsonSync('package.json');
      expect(pkgJson.name).to.equal('foo', 'uses app name for package name');
    })
  );

  describe('verify dependencies', function() {
    it(
      'are locked down for pre-1.0 versions',
      co.wrap(function*() {
        yield movable([
          'new',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
          '--yarn',
          '--welcome'
        ]);

        let pkg = fs.readJsonSync('package.json');

        assertVersionLock(pkg.dependencies);
        assertVersionLock(pkg.devDependencies);
      })
    );
  });
});
