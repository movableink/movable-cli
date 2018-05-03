const package = require('../../package.json');

module.exports = function versionApi() {
  return function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      mdk: package.version,
      node: process.versions.node
    }));
  };
};
