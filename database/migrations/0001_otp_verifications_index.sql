ALTER TABLE otp_verifications
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone_created
  ON otp_verifications (phone, created_at DESC);
