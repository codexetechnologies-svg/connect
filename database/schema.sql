CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE account_role AS ENUM ('supplier', 'medical_shop', 'admin');
CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE medicine_status AS ENUM ('active', 'inactive', 'recalled', 'restricted');
CREATE TYPE medicine_type AS ENUM ('generic', 'branded_generic', 'innovator_brand');
CREATE TYPE dispensing_type AS ENUM ('otc', 'prescription');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'grace', 'suspended', 'cancelled', 'expired');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role account_role NOT NULL,
  email VARCHAR(320) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  full_name TEXT NOT NULL,
  status account_status NOT NULL DEFAULT 'pending',
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  consent_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  proprietor_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Tamil Nadu',
  pincode VARCHAR(6) NOT NULL,
  gstin VARCHAR(15),
  wholesale_license_number TEXT NOT NULL,
  licence_type TEXT NOT NULL,
  licence_authority TEXT NOT NULL,
  licence_expiry DATE NOT NULL,
  authorised_premises TEXT,
  bank_details JSONB,
  geo geography(Point, 4326),
  delivery_radius_km INTEGER NOT NULL DEFAULT 0,
  delivery_pincodes TEXT[]
);

CREATE TABLE medical_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  retail_license_number TEXT NOT NULL,
  licence_type TEXT NOT NULL,
  licence_expiry DATE NOT NULL,
  gstin VARCHAR(15),
  address TEXT NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  district TEXT NOT NULL,
  pharmacist_name TEXT,
  pharmacist_registration_no TEXT,
  geo geography(Point, 4326)
);

CREATE TABLE shop_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES medical_shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(40) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, user_id)
);

CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(60) NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  sha256 VARCHAR(64),
  status account_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE master_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  brand_name TEXT,
  active_ingredients JSONB NOT NULL,
  manufacturer TEXT NOT NULL,
  strength TEXT NOT NULL,
  dosage_form VARCHAR(40) NOT NULL,
  dosage_sub_form VARCHAR(40) NOT NULL,
  pack_size TEXT NOT NULL,
  unit_of_measurement VARCHAR(40) NOT NULL,
  therapeutic_category TEXT,
  subcategory TEXT,
  drug_schedule VARCHAR(20) NOT NULL,
  prescription_requirement VARCHAR(24) NOT NULL,
  medicine_type medicine_type NOT NULL,
  route_of_administration TEXT NOT NULL,
  storage_conditions VARCHAR(30) NOT NULL,
  barcode_gtin VARCHAR(40),
  registry_identifier TEXT,
  public_sku_code TEXT UNIQUE,
  product_image_url TEXT,
  status medicine_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (generic_name, strength, dosage_form, dosage_sub_form, pack_size, medicine_type)
);

CREATE TABLE dosage_form_taxonomy (
  primary_form VARCHAR(40) PRIMARY KEY,
  sub_forms TEXT[] NOT NULL
);

INSERT INTO dosage_form_taxonomy VALUES
  ('Tablet', ARRAY['Normal','Dispersible','Chewable']),
  ('Capsule', ARRAY['Hard','Soft Gelatin']),
  ('Liquid', ARRAY['Syrup','Suspension','Solution','IV Fluids']),
  ('Injection', ARRAY['Vial','Ampoule','PFS']),
  ('Topical', ARRAY['Cream','Gel','Ointment','Lotion']),
  ('Drops', ARRAY['Eye','Ear','Nasal']),
  ('Inhalation', ARRAY['Inhaler','Nasal Spray','Respules']),
  ('Other', ARRAY['Powder','Sachet','Suppository','Patch']);

CREATE TABLE supplier_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES master_medicines(id) ON DELETE CASCADE,
  mrp NUMERIC(12,2) NOT NULL,
  wholesale_price NUMERIC(12,2) NOT NULL,
  gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  schemes_and_discounts TEXT,
  effective_landing_price NUMERIC(12,2),
  batch_number TEXT NOT NULL,
  batch_expiry_date DATE NOT NULL,
  stock_status stock_status NOT NULL DEFAULT 'in_stock',
  available_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_order_quantity INTEGER NOT NULL DEFAULT 1,
  delivery_charges NUMERIC(12,2) NOT NULL DEFAULT 0,
  estimated_delivery TEXT,
  is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
  is_recalled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplier_id, medicine_id, batch_number)
);

CREATE TABLE catalogue_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  staging_blob_key TEXT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  error_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE batch_recall_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES supplier_listings(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES master_medicines(id),
  batch_number TEXT NOT NULL,
  reason TEXT NOT NULL,
  recall_source TEXT,
  recalled_by UUID REFERENCES users(id),
  recalled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES master_medicines(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_type VARCHAR(40) NOT NULL,
  query_text TEXT NOT NULL,
  filters JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  medicine_id UUID REFERENCES master_medicines(id),
  requested_quantity INTEGER NOT NULL,
  message TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_role account_role NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active_sku_limit INTEGER,
  monthly_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  annual_fee NUMERIC(12,2),
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  trial_days INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  grace_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  razorpay_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gst_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  account_id UUID NOT NULL REFERENCES users(id),
  invoice_number VARCHAR(60) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12,2) NOT NULL,
  cgst NUMERIC(12,2) NOT NULL DEFAULT 0,
  sgst NUMERIC(12,2) NOT NULL DEFAULT 0,
  igst NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'issued',
  pdf_storage_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  account_id UUID NOT NULL REFERENCES users(id),
  razorpay_payment_id TEXT,
  razorpay_subscription_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL,
  payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medicines_trgm ON master_medicines USING gin (medicine_name gin_trgm_ops, generic_name gin_trgm_ops, brand_name gin_trgm_ops);
CREATE INDEX idx_medicines_gtin ON master_medicines (barcode_gtin);
CREATE INDEX idx_supplier_geo ON suppliers USING gist (geo);
CREATE INDEX idx_shop_geo ON medical_shops USING gist (geo);
CREATE INDEX idx_supplier_listing_medicine ON supplier_listings (medicine_id, is_active);
CREATE INDEX idx_supplier_listing_expiry ON supplier_listings (batch_expiry_date);
CREATE INDEX idx_enquiries_seller ON enquiries (seller_id, status, created_at DESC);
CREATE INDEX idx_otp_verifications_phone_created ON otp_verifications (phone, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs (actor_id, created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_self ON suppliers FOR ALL
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY shop_self ON medical_shops FOR ALL
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY listing_owner ON supplier_listings FOR ALL
  USING (
    current_setting('app.current_role', true) = 'admin'
    OR supplier_id::text = current_setting('app.current_user_id', true)
    OR EXISTS (
      SELECT 1 FROM users viewer
      WHERE viewer.id::text = current_setting('app.current_user_id', true)
        AND viewer.status = 'approved'
    )
  )
  WITH CHECK (supplier_id::text = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'admin');

CREATE POLICY enquiry_participant ON enquiries FOR ALL
  USING (seller_id::text = current_setting('app.current_user_id', true)
    OR buyer_id::text = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'admin')
  WITH CHECK (buyer_id::text = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'admin');
