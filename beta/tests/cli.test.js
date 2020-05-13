'use strict';
const { execFile } = require('child_process');
const assert = require('assert');
const rootPath = require('app-root-path');
const pkg = require(rootPath.resolve(`/package.json`));
const cliPath = rootPath.resolve(pkg.bin['movable-beta']);

describe('Movable Command', () => {
  it('Gets version number', async () => {
    const data = await new Promise((resolve, reject) => {
      execFile('node', [cliPath, '--version'], (error, stdout, stderr) => {
        resolve(stdout.toString().replace(/\r\n|\n/g, ''));
      });
    });

    const expected = pkg.version;
    assert.equal(data, expected);
  });
});
