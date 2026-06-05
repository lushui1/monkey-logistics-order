import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

// Database connection - gracefully handle missing URL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/placeholder';
export const sql = neon(databaseUrl);
export const db = drizzle(sql);

// 解析规则表
export const parsingRules = pgTable('parsing_rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  fileType: text('file_type').notNull(), // 'excel' | 'word' | 'pdf'
  ruleConfig: text('rule_config').notNull(), // JSON 字符串
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  fileTypeIdx: index('file_type_idx').on(table.fileType),
}));

// 运单表
export const waybills = pgTable('waybills', {
  id: text('id').primaryKey(),
  externalCode: text('external_code'), // 外部编码
  storeName: text('store_name'), // 收货门店
  recipientName: text('recipient_name'), // 收件人姓名
  recipientPhone: text('recipient_phone'), // 收件人电话
  recipientAddress: text('recipient_address'), // 收件人地址
  skuCode: text('sku_code').notNull(), // SKU 物品编码
  skuName: text('sku_name').notNull(), // SKU 物品名称
  skuQuantity: integer('sku_quantity').notNull(), // SKU 发货数量
  skuSpec: text('sku_spec'), // SKU 规格型号
  remark: text('remark'), // 备注
  status: text('status').default('pending').notNull(), // pending | submitted | failed
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  externalCodeIdx: index('external_code_idx').on(table.externalCode),
  recipientNameIdx: index('recipient_name_idx').on(table.recipientName),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// 关系定义
export const parsingRulesRelations = relations(parsingRules, () => ({}));

export const waybillsRelations = relations(waybills, () => ({}));

// 类型导出
export type ParsingRule = typeof parsingRules.$inferSelect;
export type NewParsingRule = typeof parsingRules.$inferInsert;
export type Waybill = typeof waybills.$inferSelect;
export type NewWaybill = typeof waybills.$inferInsert;
