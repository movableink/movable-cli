module.exports = function(port) {
  return function(req, res) {
    res.writeHead(200, {
      "content-type": "application/json"
    });
    res.end(JSON.stringify({ port }));
  };
};
