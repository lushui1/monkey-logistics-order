import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

// Database connection - use proper format for placeholder
const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:pass@localhost/neondb/monkey-logistics?sslmode=require';
export const sql = neon(databaseUrl);
export const db = drizzle(sql);

// 解析规则表
export const parsingRules = pgTable('parsing_rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  fileType: text('file_type').notNull(),
  ruleConfig: text('rule_config').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  fileTypeIdx: index('file_type_idx').on(table.fileType),
}));

// 运单表
export const waybills = pgTable('waybills', {
  id: text('id').primaryKey(),
  externalCode: text('external_code'),
  storeName: text('store_name'),
  recipientName: text('recipient_name'),
  recipientPhone: text('recipient_phone'),
  recipientAddress: text('recipient_address'),
  skuCode: text('sku_code').notNull(),
  skuName: text('sku_name').notNull(),
  skuQuantity: integer('sku_quantity').notNull(),
  skuSpec: text('sku_spec'),
  remark: text('remark'),
  status: text('status').default('pending').notNull(),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  externalCodeIdx: index('external_code_idx').on(table.externalCode),
  recipientNameIdx: index('recipient_name_idx').on(table.recipientName),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// 类型导出（简化版本）
export type ParsingRule = any;
export type NewParsingRule = any;
export type Waybill = any;
export type NewWaybill = any;

// 关系定义（简化版本）
export const parsingRulesRelations = {};
export const waybillsRelations = {};
