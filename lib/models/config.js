const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const defaultPath = path.join(os.homedir(), '.mdk');

class Config {
  constructor(path=defaultPath) {
    this.path = path;
  }

  async read() {
    try {
      const raw = await readFile(this.path);
      return JSON.parse(raw);
    } catch(e) {
      return {};
    }
  }

  async append(newData={}) {
    const data = await this.read();
    Object.assign(data, newData);
    await this.write(data);
    return data;
  }

  write(data) {
    const raw = JSON.stringify(data, null, 2);
    return writeFile(this.path, raw);
  }
}

module.exports = Config;
