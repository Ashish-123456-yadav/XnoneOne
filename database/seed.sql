INSERT INTO users (id, email, username, role, is_verified)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'ava@novasocial.ai', 'ava_ai', 'creator', TRUE),
  ('00000000-0000-4000-8000-000000000002', 'mina@novasocial.ai', 'minamakes', 'creator', TRUE),
  ('00000000-0000-4000-8000-000000000003', 'admin@novasocial.ai', 'nova_admin', 'admin', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO profiles (user_id, display_name, bio, avatar_url, creator_category, follower_count, following_count, post_count)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Ava Chen', 'Building practical AI creator workflows.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'Education', 12840, 231, 42),
  ('00000000-0000-4000-8000-000000000002', 'Mina Lee', 'Short-form storytelling, editing, and launches.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'Film', 23810, 420, 87),
  ('00000000-0000-4000-8000-000000000003', 'Nova Admin', 'Platform operations.', NULL, 'Operations', 0, 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO admins (user_id, scopes)
VALUES ('00000000-0000-4000-8000-000000000003', ARRAY['read', 'moderate', 'ban', 'analytics'])
ON CONFLICT DO NOTHING;
