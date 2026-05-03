exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_push_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      fcm_token text NOT NULL,
      device_id text,
      platform varchar(20) NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT user_push_tokens_platform_chk CHECK (platform IN ('ios', 'android', 'web')),
      CONSTRAINT user_push_tokens_unique_token UNIQUE (fcm_token)
    );

    CREATE INDEX IF NOT EXISTS user_push_tokens_user_active_idx
    ON user_push_tokens (user_id, is_active, updated_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS user_push_tokens;
  `);
};
