const ApiClient = require('../models/api-client');
const Config = require('../models/config');
const defaultConfig = require('../defaults');

module.exports = function fontApi() {
  return async function(req, res) {
    const userConfig = new Config(defaultConfig.userConfigPath);
    const client = new ApiClient(Object.assign({}, defaultConfig, { userConfig }));

    res.writeHead(200, { 'Content-Type': 'application/json' });

    try {
      const fonts = await client.get('/api/v2/custom_fonts');
      res.end(fonts);
    } catch(e) {
      res.end(JSON.stringify({ custom_fonts: [] }));
      console.error(e.message);
    }
  };
};
