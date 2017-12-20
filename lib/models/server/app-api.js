module.exports = function(root) {
  return function(req, res) {
    if (req.method === "GET") {
      res.end(
        "This method is only accessible via POST, from the Studio Dev Editor. Otherwise there won't be any injected MI.options."
      );
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
