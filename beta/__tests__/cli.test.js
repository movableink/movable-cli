'use strict';
const path = require('path');
const { execFile } = require('child_process');
const pkg = require('../../package.json');

const cliPath = path.resolve(__dirname, '../../', pkg.bin['movable-beta']);

describe('Movable Command', () => {
  it('Gets version number', async () => {
    const data = await new Promise((resolve, reject) => {
      execFile('node', [cliPath, '--version'], (error, stdout, stderr) => {
        resolve(stdout.toString().replace(/\r\n|\n/g, ''));
      });
    });

    const expected = pkg.version;
    expect(data).toBe(expected);
  });
});
