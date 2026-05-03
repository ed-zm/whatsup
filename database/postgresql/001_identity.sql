CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL UNIQUE,
  display_name varchar(120),
  avatar_url text,
  about text,
  is_phone_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_phone_number_e164_chk CHECK (phone_number ~ '^\+[1-9][0-9]{7,14}$')
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(120) NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS contacts (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alias varchar(120),
  is_favorite boolean NOT NULL DEFAULT false,
  blocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, contact_user_id),
  CONSTRAINT contacts_no_self_reference_chk CHECK (user_id <> contact_user_id)
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL,
  otp_hash text NOT NULL,
  purpose varchar(40) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  attempts_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  sent_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT otp_verifications_phone_number_e164_chk CHECK (phone_number ~ '^\+[1-9][0-9]{7,14}$'),
  CONSTRAINT otp_verifications_purpose_chk CHECK (purpose IN ('registration', 'login', 'phone_change')),
  CONSTRAINT otp_verifications_status_chk CHECK (status IN ('pending', 'verified', 'expired', 'blocked')),
  CONSTRAINT otp_verifications_attempts_chk CHECK (attempts_count >= 0 AND max_attempts > 0)
);

CREATE INDEX IF NOT EXISTS contacts_contact_user_id_idx
ON contacts (contact_user_id);

CREATE INDEX IF NOT EXISTS otp_verifications_phone_status_expires_idx
ON otp_verifications (phone_number, status, expires_at DESC);

CREATE INDEX IF NOT EXISTS otp_verifications_pending_phone_idx
ON otp_verifications (phone_number, sent_at DESC)
WHERE status = 'pending';
