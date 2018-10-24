module.exports = function(root) {
  return function(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('[]');
  };
};
