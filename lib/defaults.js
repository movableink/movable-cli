const os = require('os');
const path = require('path');

module.exports = {
  oauth: {
    client: {
      id: "9252b25d510134af78f5386fb9bc6266a31f795f920bae79ef7d2e42df8fc9ac",
      secret: "bc928a734c23e669f45daeb10d0ab7be22a6c77244ba205a8ad1fae2048c777d"
    },
    auth: {
      tokenHost: "https://app.movableink.com/oauth/authorize"
    },
    callbackURL: 'http://localhost:14943/oauth/callback',
    scope: 'mdk'
  },
  api: {
    host: 'app.movableink.com',
    protocol: 'https'
  },
  userConfigPath: path.join(os.homedir(), '.mdk')
};
