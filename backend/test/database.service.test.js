const assert = require('node:assert/strict');
const test = require('node:test');
const { DatabaseService } = require('../dist/infrastructure/database/database.service');

test('DatabaseService exposes seeded public feed data', () => {
  const database = new DatabaseService();
  const page = database.listFeed(null, { cursor: null, limit: 10 });

  assert.ok(page.items.length >= 2);
  assert.equal(page.items[0].status, 'published');
  assert.ok(page.items[0].creator.username);
  assert.ok(page.items[0].video.hlsManifestUrl);
});

test('DatabaseService supports idempotent likes', () => {
  const database = new DatabaseService();
  const user = database.findUserByEmail('ava@novasocial.ai');
  const post = database.listFeed(null, { cursor: null, limit: 1 }).items[0];

  database.likePost(user.id, post.id);
  const afterSecondLike = database.likePost(user.id, post.id);
  const afterUnlike = database.unlikePost(user.id, post.id);

  assert.equal(afterSecondLike.liked, true);
  assert.equal(afterUnlike.liked, false);
});
