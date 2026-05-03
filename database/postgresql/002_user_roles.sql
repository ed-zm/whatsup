CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS user_roles_role_id_idx
ON user_roles (role_id);

INSERT INTO roles (name, description)
VALUES ('user', 'Default authenticated user role')
ON CONFLICT (name) DO NOTHING;
