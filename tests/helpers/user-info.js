const accessToken = {
  access_token: '5683E74C-7514-4426-B64F-CF0C24223F69',
  refresh_token: '8D175C5F-AE24-4333-8795-332B3BDA8FE3',
  token_type: 'bearer',
  expires_in: '240000'
};

// Data for ~/.mdk
const userInfo = {
  auth: {
    token: {
      access_token: accessToken.access_token,
      refresh_token: accessToken.refresh_token,
      token_type: accessToken.token_type,
      expires_in: accessToken.expires_in,
      created_at: new Date().getTime(),
      expires_at: new Date(new Date().getTime() + parseInt(accessToken.expires_in))
    }
  },
  user: {
    id: 1,
    email: 'foo@example.com',
    company_id: 1,
    features: {}
  },
  company: {
    id: 1,
    name: 'MyCo',
    slug: 'my-co'
  }
};

module.exports = { userInfo, accessToken };
