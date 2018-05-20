const ApiClient = require('../models/api-client');
const Config = require('../models/config');
const defaultConfig = require('../defaults');

const fallbackResponse = JSON.stringify({
  companies: [{ id: 0, name: "Local", products: { live_content: true } }],
  user: { name: "Local User", company_id: 0, id: "me", features: {} }
});

module.exports = function userApi() {
  return async function(req, res) {
    const userConfig = new Config(defaultConfig.userConfigPath);
    const client = new ApiClient(Object.assign({}, defaultConfig, { userConfig }));
    let options = await userConfig.read();

    res.writeHead(200, { 'Content-Type': 'application/json' });

    if (options.auth) {
      try {
        options = await client.refreshUserInfo();

        const user = options.user;
        const companies = [options.company];

        res.end(JSON.stringify({ user, companies }));
      } catch (error) {
        res.end(fallbackResponse);
      }
    } else {
      res.end(fallbackResponse);
    }
  };
};
