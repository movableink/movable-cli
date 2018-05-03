exports.put = function put(root) {
  return function(req, res) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  };
};
