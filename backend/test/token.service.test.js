const assert = require('node:assert/strict');
const test = require('node:test');
const { TokenService } = require('../dist/infrastructure/auth/token.service');

test('TokenService signs and verifies access tokens', () => {
  const service = new TokenService();
  const issued = service.createAccessToken({
    sub: 'user-1',
    email: 'creator@novasocial.ai',
    username: 'creator',
    role: 'creator',
  });

  const payload = service.verifyAccessToken(issued.token);

  assert.equal(payload.sub, 'user-1');
  assert.equal(payload.type, 'access');
  assert.equal(payload.role, 'creator');
  assert.equal(typeof issued.expiresIn, 'number');
});
