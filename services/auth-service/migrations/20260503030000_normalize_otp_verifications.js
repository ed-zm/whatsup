exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone varchar(20) NOT NULL,
      otp_hash text NOT NULL,
      expires_at timestamptz NOT NULL,
      used boolean NOT NULL DEFAULT false,
      CONSTRAINT otp_verifications_phone_e164_chk CHECK (phone ~ '^\\+[1-9][0-9]{7,14}$')
    );

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'otp_verifications'
          AND column_name = 'phone_number'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'otp_verifications'
          AND column_name = 'phone'
      ) THEN
        ALTER TABLE otp_verifications RENAME COLUMN phone_number TO phone;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'otp_verifications'
          AND column_name = 'used'
      ) THEN
        ALTER TABLE otp_verifications ADD COLUMN used boolean NOT NULL DEFAULT false;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'otp_verifications'
          AND column_name = 'status'
      ) THEN
        UPDATE otp_verifications
        SET used = true
        WHERE status = 'verified';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'otp_verifications'
          AND column_name = 'purpose'
      ) THEN
        ALTER TABLE otp_verifications ALTER COLUMN purpose DROP NOT NULL;
      END IF;
    END $$;

    DROP INDEX IF EXISTS otp_verifications_phone_status_expires_idx;
    DROP INDEX IF EXISTS otp_verifications_pending_phone_idx;

    CREATE INDEX IF NOT EXISTS otp_verifications_phone_valid_idx
    ON otp_verifications (phone, expires_at DESC)
    WHERE used = false;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS otp_verifications_phone_valid_idx;
  `);
};
