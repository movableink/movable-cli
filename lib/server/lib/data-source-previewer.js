const request = require('request');
const ApiClient = require('../../models/api-client');
const Config = require('../../models/config');
const defaultConfig = require('../../defaults');
const querystring = require('querystring');

const baseUrl = 'https://sorcerer.movableink-templates.com/data_source_tester';

module.exports = async function fetch(dataSource, params) {
  const userConfig = new Config(defaultConfig.userConfigPath);
  const client = new ApiClient(Object.assign({}, defaultConfig, { userConfig }));
  let options = await userConfig.read();

  let token = options.auth.sorcerer;

  // Token is recent if it was obtained in the last 12 hours
  const updated = new Date(options.updated) || 0;
  const recent = new Date() - updated < (12 * 60 * 60 * 1000);

  if (!recent || !token) {
    options = await client.refreshUserInfo();
    token = options.auth.sorcerer;
  }

  const query = querystring.stringify(params);

  return new Promise((resolve, reject) => {
    request.post({
      url: [baseUrl, query].join('?'),
      headers: {
        'Content-type': 'application/json',
        authorization: token
      },
      body: JSON.stringify({ dataSource })
    }, function(error, response, body) {
      if (error) {
        reject(error);
      } else {
        resolve({ response, body });
      }
    });
  });
};
