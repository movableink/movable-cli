module.exports = function(server, port) {
  return function(req, res) {
    const { tunnelUrl } = server;
    res.writeHead(200, {
      "content-type": "application/json"
    });
    res.end(JSON.stringify({ port, tunnelUrl }));
  };
};
