CREATE TYPE "public"."account_role" AS ENUM('supplier', 'medical_shop', 'admin');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."dispensing_type" AS ENUM('otc', 'prescription');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'quoted', 'follow_up', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."medicine_status" AS ENUM('active', 'inactive', 'recalled', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."medicine_type" AS ENUM('generic', 'branded_generic', 'innovator_brand');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('in_stock', 'low_stock', 'out_of_stock');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'grace', 'suspended', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"medical_shop_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"message" text,
	"supplier_response" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"document_type" varchar(60) NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"sha256" varchar(64),
	"status" "account_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medicine_name" text NOT NULL,
	"generic_name" text NOT NULL,
	"brand_name" text,
	"active_ingredients" jsonb NOT NULL,
	"manufacturer" text NOT NULL,
	"strength" text NOT NULL,
	"dosage_form" varchar(40) NOT NULL,
	"dosage_sub_form" varchar(40) NOT NULL,
	"pack_size" text NOT NULL,
	"unit_of_measure" varchar(40) NOT NULL,
	"therapeutic_category" text,
	"subcategory" text,
	"drug_schedule" varchar(20) NOT NULL,
	"dispensing_type" "dispensing_type" NOT NULL,
	"medicine_type" "medicine_type" NOT NULL,
	"route_of_administration" text NOT NULL,
	"storage_conditions" varchar(30) NOT NULL,
	"barcode_gtin" varchar(40),
	"registry_identifier" text,
	"product_image_url" text,
	"status" "medicine_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shop_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"retail_license_number" text NOT NULL,
	"licence_type" text NOT NULL,
	"licence_expiry" date NOT NULL,
	"gstin" varchar(15),
	"address" text NOT NULL,
	"pincode" varchar(6) NOT NULL,
	"district" text NOT NULL,
	"pharmacist_name" text,
	"pharmacist_registration_no" text
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(40) NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" varchar(50) NOT NULL,
	"sku_limit" integer NOT NULL,
	"monthly_fee" numeric(10, 2) NOT NULL,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
CREATE TABLE "supplier_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"mrp" numeric(12, 2) NOT NULL,
	"wholesale_price" numeric(12, 2) NOT NULL,
	"gst_percentage" numeric(5, 2) NOT NULL,
	"schemes" text,
	"batch_number" text NOT NULL,
	"batch_expiry_date" date NOT NULL,
	"stock_status" "stock_status" NOT NULL,
	"available_quantity" integer DEFAULT 0 NOT NULL,
	"minimum_order_quantity" integer DEFAULT 1 NOT NULL,
	"delivery_charges" numeric(12, 2) DEFAULT '0' NOT NULL,
	"estimated_delivery" text,
	"is_quarantined" boolean DEFAULT false NOT NULL,
	"is_recalled" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"proprietor_name" text NOT NULL,
	"contact_person" text NOT NULL,
	"address" text NOT NULL,
	"district" text NOT NULL,
	"state" text DEFAULT 'Tamil Nadu' NOT NULL,
	"pincode" varchar(6) NOT NULL,
	"gstin" varchar(15),
	"wholesale_license_number" text NOT NULL,
	"licence_type" text NOT NULL,
	"licence_authority" text NOT NULL,
	"licence_expiry" date NOT NULL,
	"bank_details" jsonb,
	"delivery_radius_km" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'trial' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "account_role" NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255),
	"phone" varchar(20),
	"full_name" text NOT NULL,
	"status" "account_status" DEFAULT 'pending' NOT NULL,
	"session_version" integer DEFAULT 0 NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"consent_accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_supplier_id_users_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_medical_shop_id_users_id_fk" FOREIGN KEY ("medical_shop_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_medicine_id_master_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."master_medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_shops" ADD CONSTRAINT "medical_shops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_users" ADD CONSTRAINT "shop_users_shop_id_medical_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."medical_shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_users" ADD CONSTRAINT "shop_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_listings" ADD CONSTRAINT "supplier_listings_supplier_id_users_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_listings" ADD CONSTRAINT "supplier_listings_medicine_id_master_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."master_medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_auth_tokens_user_purpose" ON "auth_tokens" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "idx_enquiries_supplier" ON "enquiries" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_enquiries_shop" ON "enquiries" USING btree ("medical_shop_id");--> statement-breakpoint
CREATE INDEX "idx_otp_verifications_phone_created" ON "otp_verifications" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_subscriptions_user" ON "user_subscriptions" USING btree ("user_id");