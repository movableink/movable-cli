const path = require("path");
const fs = require("fs");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

exports.writeProjectFile = function writeProjectFile(root, relativePath, data) {
  if (!data) {
    return null;
  }

  if (data[data.length - 1] !== "\n") {
    // Files should end in newlines
    data += "\n";
  }

  console.log(`Saving ${relativePath}...`);

  const fullPath = path.resolve(root, relativePath);
  if (fullPath.indexOf(root) === 0) {
    return writeFile(fullPath, data);
  } else {
    throw "path outside of project directory: " + path;
  }
};

exports.readProjectFile = function readProjectFile(root, relativePath) {
  const fullPath = path.resolve(root, relativePath);
  if (fullPath.indexOf(root) === 0) {
    return readFile(fullPath);
  } else {
    throw "path outside of project directory: " + path;
  }
};
