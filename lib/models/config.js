'use strict';

/**
@module movable-cli
*/

const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const defaultPath = path.join(os.homedir(), '.mdk');

/**
 * Config reads, writes, and appends data to a path (default ~/.mdk) in json format.
 *
 * @class Config
 * @extends CoreObject
 * @constructor
 **/
class Config {
  constructor(path=defaultPath) {
    this.path = path;
  }

  /**
    Reads JSON out of the config file and returns the parsed data.

    @public
    @method read
  */
  async read() {
    try {
      const raw = await readFile(this.path);
      return JSON.parse(raw);
    } catch(e) {
      return {};
    }
  }

  /**
    Reads data from the config file, merges new data, and writes the result back.

    @public
    @method append
  */
  async append(newData={}) {
    const data = await this.read();
    Object.assign(data, newData);
    await this.write(data);
    return data;
  }

  /**
    Stringifies passed data and writes it to the config file, overwriting it.

    @public
    @method write
  */
  write(data) {
    const raw = JSON.stringify(data, null, 2);
    return writeFile(this.path, raw);
  }
}

module.exports = Config;
