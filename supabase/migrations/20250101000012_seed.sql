-- ── Seed: Categories ─────────────────────────────────────────
-- Base category set for the Five College community launch.
-- Additional categories can be inserted by an admin at runtime.

INSERT INTO categories (id, name, slug) VALUES
  (gen_random_uuid(), 'Web Development',     'web-development'),
  (gen_random_uuid(), 'Graphic Design',      'graphic-design'),
  (gen_random_uuid(), 'Photography',         'photography'),
  (gen_random_uuid(), 'Video Editing',       'video-editing'),
  (gen_random_uuid(), 'Tutoring',            'tutoring'),
  (gen_random_uuid(), 'Writing & Editing',   'writing-editing'),
  (gen_random_uuid(), 'Music & Audio',       'music-audio'),
  (gen_random_uuid(), 'Landscaping',         'landscaping'),
  (gen_random_uuid(), 'Cleaning',            'cleaning'),
  (gen_random_uuid(), 'Moving Help',         'moving-help'),
  (gen_random_uuid(), 'Handyman Services',   'handyman-services'),
  (gen_random_uuid(), 'Data Entry',          'data-entry'),
  (gen_random_uuid(), 'Social Media',        'social-media'),
  (gen_random_uuid(), 'Translation',         'translation'),
  (gen_random_uuid(), 'Event Planning',      'event-planning')
ON CONFLICT (slug) DO NOTHING