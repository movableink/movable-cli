const path = require('path');
const fs = require("fs");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

module.exports = function manifestFile(assetPath, root) {
  const fullPath = path.resolve(root, assetPath);

  if (fullPath.indexOf(root) === 0 && fs.existsSync(fullPath)) {
    return readFile(fullPath).then(buffer => {
      return buffer.toString();
    });
  }
  return null;
};
