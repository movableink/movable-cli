module.exports = function(app, options) {
  console.log(options);

  app.use(function(req, res) {
    res.sendFile();
  });
};
