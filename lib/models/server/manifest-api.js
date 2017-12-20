exports.put = function put(root) {
  return function(req, res) {
    console.log(req.body);

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  };
};
