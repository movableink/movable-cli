const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function sendContent(res, content) {
  const length = Buffer.byteLength(content, 'utf8');
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "X-XSS-Protection": 0,
    "content-length": length
  });
  res.end(content);
}

module.exports = function(root) {
  const tmpFilePath = path.join(root, 'dist', '.compiled-index.html');

  return function(req, res) {
    if (req.method === "POST") {
      let content = req.body.content || "";
      writeFile(tmpFilePath, content).then(() => {
        sendContent(res, content);
      });
    } else {
      readFile(tmpFilePath).then((content) => {
        sendContent(res, content);
      }).catch((e) => {
        res.writeHead(500, {});
        res.end("You need to have the Preview panel open at the same time in order for this page to work.");
      });
    }
  };
};
