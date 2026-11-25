BEGIN;

DO $$ BEGIN
  CREATE TYPE kyc_document_status AS ENUM ('pending_upload', 'pending_review', 'approved', 'rejected', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE account_deletion_status AS ENUM ('pending', 'failed', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_auth_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_supabase_auth_id
  ON users (supabase_auth_id);

DO $$
DECLARE
  unexpected_statuses TEXT;
BEGIN
  SELECT string_agg(DISTINCT status::text, ', ' ORDER BY status::text)
    INTO unexpected_statuses
    FROM kyc_documents
   WHERE status::text NOT IN (
     'pending', 'pending_upload', 'pending_review', 'approved', 'rejected', 'suspended'
   );
  IF unexpected_statuses IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot migrate unknown KYC document statuses: %', unexpected_statuses;
  END IF;
END $$;

ALTER TABLE kyc_documents
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE kyc_documents
  ALTER COLUMN status TYPE kyc_document_status
  USING (
    CASE status::text
      WHEN 'pending' THEN 'pending_review'
      WHEN 'approved' THEN 'approved'
      WHEN 'rejected' THEN 'rejected'
      WHEN 'suspended' THEN 'suspended'
      WHEN 'pending_upload' THEN 'pending_upload'
      WHEN 'pending_review' THEN 'pending_review'
    END
  )::kyc_document_status;

ALTER TABLE kyc_documents
  ALTER COLUMN status SET DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS upload_expires_at TIMESTAMPTZ;

ALTER TABLE kyc_documents
  DROP CONSTRAINT IF EXISTS kyc_documents_reviewed_by_users_id_fk,
  DROP CONSTRAINT IF EXISTS kyc_documents_reviewed_by_fkey;
ALTER TABLE kyc_documents
  ADD CONSTRAINT kyc_documents_reviewed_by_users_id_fk
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  cashfree_order_id TEXT NOT NULL UNIQUE,
  cashfree_payment_id TEXT UNIQUE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status billing_payment_status NOT NULL DEFAULT 'pending',
  provider_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE billing_payments
  ALTER COLUMN account_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS billing_payments_account_id_users_id_fk,
  DROP CONSTRAINT IF EXISTS billing_payments_account_id_fkey;
ALTER TABLE billing_payments
  ADD CONSTRAINT billing_payments_account_id_users_id_fk
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS account_deletion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  supabase_auth_id UUID NOT NULL,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  storage_keys JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(storage_keys) = 'array'),
  status account_deletion_status NOT NULL DEFAULT 'pending',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_account_status
  ON kyc_documents (account_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity_created
  ON admin_audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_payments_status_paid_at
  ON billing_payments (status, paid_at);
CREATE INDEX IF NOT EXISTS idx_billing_payments_account_created
  ON billing_payments (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_deletion_jobs_account_status
  ON account_deletion_jobs (account_id, status);

COMMIT;
