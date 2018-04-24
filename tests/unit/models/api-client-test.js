'use strict';

describe('models/api-client-test', function() {
  describe('#getConfig', function() {
    it('fetches the user config');
  });

  describe('#getAccessToken', function() {
    it('returns a valid token');
    it('returns a valid token when existing access token is stale');
    it('rejects when existing access token is invalid');
    it('updates the user config with new access token');
  });

  describe('#get', function() {
    it('fetches data successfully');
    it('rejects when api returns 4xx/5xx');
    it('rejects when api fails');
    it('defaults to dashboard host');
  });

  describe('#refreshUserInfo', function() {
    it('throws when API returns non-json');
    it('throws when API returns wrong json');
    it('updates user config file');
  });
});
