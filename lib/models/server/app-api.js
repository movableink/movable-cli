const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

module.exports = function(root) {
  return function(req, res) {
    if (req.method === "GET") {
      getIndexPath(root).then(path => {
        res.sendFile(path);
      });
      return;
    }

    let content = req.body.content || "";
    res.writeHead(200, {
      "content-type": "text/html",
      "X-XSS-Protection": 0,
      "content-length": content.length
    });
    res.end(content);
  };
};

async function getIndexPath(root) {
  const manifestPath = path.join(root, "manifest.yml");
  const manifestData = await readFile(manifestPath);
  let manifest = yaml.safeLoad(manifestData);

  const htmlLocation = manifest.html_file || "index.html";
  const fullPath = path.resolve(root, htmlLocation);
  if (fullPath.indexOf(root) === 0 && fs.existsSync(fullPath)) {
    return fullPath;
  } else {
    throw("Unable to load html file from manifest");
  }
}
