import {
  boolean, pgEnum, pgTable, text, timestamp, uuid, varchar
} from 'drizzle-orm/pg-core';

export const accountRole = pgEnum('account_role', ['supplier', 'medical_shop', 'admin']);
export const accountStatus = pgEnum('account_status', ['pending', 'approved', 'rejected', 'suspended']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: accountRole('role').notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  fullName: text('full_name').notNull(),
  status: accountStatus('status').default('pending').notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  consentAcceptedAt: timestamp('consent_accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
