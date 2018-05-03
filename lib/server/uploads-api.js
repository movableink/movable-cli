const fs = require('fs');
const url = require('url');
const path = require('path');
const formidable = require('formidable');

function parseForm(req, opts={}) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm(opts);

    form.parse(req, function(err, fields, files) {
      if(err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

function moveFile(from, to) {
  return new Promise((resolve, reject) => {
    fs.rename(from, to, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/*
 * Pretend to be S3 upload API, to accept browser-based image uploads.
 * The GET method is ostensibly to generate a 'signed' url, but in our
 * case we just return ourselves as a URL.
 * The POST method uses formidable to save the file to a temporary directory,
 * then moves it to the location in the project, which is `app/img/${filename}`.
 */
module.exports = function uploadsApi(root) {
  const uploadDir = path.join(root, 'app', 'img');

  return function(req, res) {
    const { query } = url.parse(req.url, true);
    const { filename } = query;

    if(req.method === 'GET') {
      res.writeHead(200, {});
      res.end(JSON.stringify({
        url: `app/img/${filename}`,
        endpoint: '/api/canvas/signed_upload', // ourselves
        fields: {
          key: filename
        }
      }));
      return;
    }

    parseForm(req).then(({ fields, files }) => {
      const fromPath = files.file.path;
      const toPath = path.resolve(path.join(uploadDir, files.file.name));
      if(!toPath.startsWith(uploadDir)) {
        throw(new Error("bad filename"));
      }
      return moveFile(fromPath, toPath);
    }).then(() => {
      res.writeHead(204, {});
      res.end();
    }).catch(e => {
      res.writeHead(500, {});
      res.end(e.toString());
    });
  };
};
