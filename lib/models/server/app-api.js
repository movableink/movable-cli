module.exports = function(root) {
  return function(req, res) {
    let content = req.body.content || "";
    res.writeHead(200, {
      "content-type": "text/html",
      "X-XSS-Protection": 0,
      "content-length": content.length
    });
    res.end(content);
  };
};
