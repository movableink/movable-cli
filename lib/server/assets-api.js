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
      name: filename,
      asset_group_id: url,
      asset_group: {
        id: url,
        name: filename,
        pic_type: 'StaticPic',
        usage_count: 0,
        campaign_count: 0,
        email: '',
        sti_pic_type: 'static_pic',
        created_at: new Date(),
        manifest: { id: null, name: null }
      }
    };
  };

  return function(req, res) {
    const params = url.parse(req.url, true).query;
    const page = parseInt(params.page, 10) || 1;
    const perPage = parseInt(params.perPage, 10) || 40;

    glob(path.join(root, 'app', '**', '*.@(png|jpg|jpeg|gif|svg)'), (err, files) => {
      if(err) { throw(err); }

      const count = files.length;
      const lastPage = Math.ceil(files.length / perPage);

      const assets = files
            .slice((page - 1) * perPage, page * perPage)
            .map(responseObject);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ assets, meta: { count, last_page: lastPage } }));
    });
  };
};
