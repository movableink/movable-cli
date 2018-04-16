const os = require('os');
const path = require('path');

module.exports = {
  oauth: {
    client: {
      id: "e22dac0068b24ca16cca30cf2a0b21a968732fcee5cf41a18e135433ec180fdc",
      secret: "da9a25c74fa0858229041c6e25d03e4e5bbb4fa658bd16224e8c6ada52f20c26"
    },
    auth: {
      tokenHost: "http://movableink.localhost:3000/oauth/authorize"
    },
    callbackURL: 'http://localhost:14943/oauth/callback',
    scope: 'mdk'
  },
  api: {
    host: 'movableink.localhost:3000',
    protocol: 'http'
  },
  userConfigPath: path.join(os.homedir(), '.mdk')
};
