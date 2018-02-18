const path = require('path');
const url = require('url');
const glob = require('glob');

module.exports = function assetsApi(root) {
  function responseObject(file) {
    const url = file.slice(root.length + 1);
    const filename = path.basename(url);

    return {
      app_id: null,
      app_type: 'static_pic',
      created_at: new Date(),
      original_image_url: url,
      pic_type: 'static_pic',
      id: url,
      name: filename
    };
  };

  return function(req, res) {
    const params = url.parse(req.url, true).query;
    const page = parseInt(params.page, 10) || 1;
    const perPage = parseInt(params.perPage, 10) || 40;

    glob(path.join(root, 'img', '*.@(png|jpg|jpeg|gif)'), (err, files) => {
      if(err) { throw(err); }

      const assets = files
            .slice((page - 1) * perPage, page * perPage)
            .map(responseObject);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ assets }));
    });
  };
};
