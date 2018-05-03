/*
 * Build an asset from a static_pic, with `image_url` as the id. Then reflect
 * the asset + static_pic back to ember.
 */
module.exports = function() {
  return function(req, res) {
    if(!req.body) {
      res.writeHead(400, {});
      res.end("Missing POST body");
      return;
    }

    const pic = req.body.static_pic;
    const url = pic.image_url;
    pic.id = pic.asset_id = url;

    const asset = {
      created_at: new Date(),
      pic_type: 'static_pic',
      pic_id: url,
      app_type: 'static_pic',
      original_image_url: url,
      id: url,
      name: pic.name,
      width: pic.image_width,
      height: pic.image_height
    };
    req.body.asset = asset;

    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(req.body));
  };
};
