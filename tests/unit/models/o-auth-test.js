'use strict';

describe('models/o-auth', function() {
  it('creates a simpleOauth client');
  it('sets the callbackPath');

  describe('#startServer', function() {
    it('starts a server listening on the port');
  });

  describe('#accessTokenFromCode', function() {
    it('exchanges a code for an access token');
  });

  describe('#ensureValidAccessToken', function() {
    it('returns an oauth2 access token');
    it('refreshes the oauth2 access token when it is expired');
  });

  describe('#loginURL', function() {
    it('returns a login path appended to the callbackURL');
  });

  describe('#authURL', function() {
    it('generates an authorization URL');
  });
});
