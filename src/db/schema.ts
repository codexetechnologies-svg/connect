import {
  boolean, date, index, integer, jsonb, numeric, pgEnum, pgTable,
  text, timestamp, uuid, varchar
} from 'drizzle-orm/pg-core';
import { accountStatus, users } from './auth-schema';

export { accountRole, accountStatus, users } from './auth-schema';

export const stockStatus = pgEnum('stock_status', ['in_stock', 'low_stock', 'out_of_stock']);
export const medicineStatus = pgEnum('medicine_status', ['active', 'inactive', 'recalled', 'restricted']);
export const medicineType = pgEnum('medicine_type', ['generic', 'branded_generic', 'innovator_brand']);
export const dispensingType = pgEnum('dispensing_type', ['otc', 'prescription']);
export const subscriptionStatus = pgEnum('subscription_status', ['trial', 'active', 'grace', 'suspended', 'cancelled', 'expired']);

export const otpVerifications = pgTable('otp_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull(),
  codeHash: varchar('code_hash', { length: 64 }).notNull(),
  attemptCount: integer('attempt_count').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  phoneCreatedIndex: index('idx_otp_verifications_phone_created').on(table.phone, table.createdAt)
}));

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  businessName: text('business_name').notNull(),
  proprietorName: text('proprietor_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  address: text('address').notNull(),
  district: text('district').notNull(),
  state: text('state').default('Tamil Nadu').notNull(),
  pincode: varchar('pincode', { length: 6 }).notNull(),
  gstin: varchar('gstin', { length: 15 }),
  wholesaleLicenceNumber: text('wholesale_license_number').notNull(),
  licenceType: text('licence_type').notNull(),
  licenceAuthority: text('licence_authority').notNull(),
  licenceExpiry: date('licence_expiry').notNull(),
  bankDetails: jsonb('bank_details'),
  deliveryRadiusKm: integer('delivery_radius_km').default(0).notNull()
});

export const medicalShops = pgTable('medical_shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  shopName: text('shop_name').notNull(),
  ownerName: text('owner_name').notNull(),
  retailLicenceNumber: text('retail_license_number').notNull(),
  licenceType: text('licence_type').notNull(),
  licenceExpiry: date('licence_expiry').notNull(),
  gstin: varchar('gstin', { length: 15 }),
  address: text('address').notNull(),
  pincode: varchar('pincode', { length: 6 }).notNull(),
  district: text('district').notNull(),
  pharmacistName: text('pharmacist_name'),
  pharmacistRegistrationNo: text('pharmacist_registration_no')
});

export const shopUsers = pgTable('shop_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').references(() => medicalShops.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 40 }).notNull(),
  active: boolean('active').default(true).notNull()
});

export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  documentType: varchar('document_type', { length: 60 }).notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sha256: varchar('sha256', { length: 64 }),
  status: accountStatus('status').default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const masterMedicines = pgTable('master_medicines', {
  id: uuid('id').primaryKey().defaultRandom(),
  medicineName: text('medicine_name').notNull(),
  genericName: text('generic_name').notNull(),
  brandName: text('brand_name'),
  activeIngredients: jsonb('active_ingredients').notNull(),
  manufacturer: text('manufacturer').notNull(),
  strength: text('strength').notNull(),
  dosageForm: varchar('dosage_form', { length: 40 }).notNull(),
  dosageSubForm: varchar('dosage_sub_form', { length: 40 }).notNull(),
  packSize: text('pack_size').notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 40 }).notNull(),
  therapeuticCategory: text('therapeutic_category'),
  subcategory: text('subcategory'),
  drugSchedule: varchar('drug_schedule', { length: 20 }).notNull(),
  dispensingType: dispensingType('dispensing_type').notNull(),
  medicineType: medicineType('medicine_type').notNull(),
  routeOfAdministration: text('route_of_administration').notNull(),
  storageConditions: varchar('storage_conditions', { length: 30 }).notNull(),
  barcodeGtin: varchar('barcode_gtin', { length: 40 }),
  registryIdentifier: text('registry_identifier'),
  productImageUrl: text('product_image_url'),
  status: medicineStatus('status').default('active').notNull()
});

export const supplierListings = pgTable('supplier_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  medicineId: uuid('medicine_id').references(() => masterMedicines.id, { onDelete: 'cascade' }).notNull(),
  mrp: numeric('mrp', { precision: 12, scale: 2 }).notNull(),
  wholesalePrice: numeric('wholesale_price', { precision: 12, scale: 2 }).notNull(),
  gstPercentage: numeric('gst_percentage', { precision: 5, scale: 2 }).notNull(),
  schemes: text('schemes'),
  batchNumber: text('batch_number').notNull(),
  batchExpiryDate: date('batch_expiry_date').notNull(),
  stockStatus: stockStatus('stock_status').notNull(),
  availableQuantity: integer('available_quantity').default(0).notNull(),
  minimumOrderQuantity: integer('minimum_order_quantity').default(1).notNull(),
  deliveryCharges: numeric('delivery_charges', { precision: 12, scale: 2 }).default('0').notNull(),
  estimatedDelivery: text('estimated_delivery'),
  quarantined: boolean('is_quarantined').default(false).notNull(),
  recalled: boolean('is_recalled').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).defaultNow().notNull()
});
