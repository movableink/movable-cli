const os = require('os');
const path = require('path');

const dashboardUrl = process.env.DASHBOARD_URL || "https://app.movableink.com";

module.exports = {
  oauth: {
    client: {
      id: process.env.OAUTH_CLIENT_ID || "9252b25d510134af78f5386fb9bc6266a31f795f920bae79ef7d2e42df8fc9ac",
      secret: process.env.OAUTH_CLIENT_SECRET || "bc928a734c23e669f45daeb10d0ab7be22a6c77244ba205a8ad1fae2048c777d"
    },
    auth: {
      tokenHost: `${dashboardUrl}/oauth/authorize`
    },
    callbackURL: 'http://localhost:14943/oauth/callback',
    scope: 'mdk'
  },
  dashboardUrl,
  userConfigPath: path.join(os.homedir(), '.mdk')
};
