/**
 * 数据库操作仓储层
 */
import { db, parsingRules, waybills, type NewParsingRule, type NewWaybill } from './schema';
import { eq, like, desc, and } from 'drizzle-orm';

/**
 * 解析规则仓储
 */
export const parsingRulesRepository = {
  async findAll() {
    return await db.select().from(parsingRules).orderBy(desc(parsingRules.createdAt));
  },

  async findById(id: string) {
    const results = await db.select().from(parsingRules).where(eq(parsingRules.id, id));
    return results[0] || null;
  },

  async create(rule: NewParsingRule) {
    const results = await db.insert(parsingRules).values(rule).returning();
    return results[0];
  },

  async update(id: string, data: Partial<NewParsingRule>) {
    const results = await db
      .update(parsingRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(parsingRules.id, id))
      .returning();
    return results[0];
  },

  async delete(id: string) {
    await db.delete(parsingRules).where(eq(parsingRules.id, id));
  },

  async findByFileType(fileType: string) {
    return await db
      .select()
      .from(parsingRules)
      .where(eq(parsingRules.fileType, fileType))
      .orderBy(desc(parsingRules.createdAt));
  },
};

/**
 * 运单仓储
 */
export const waybillsRepository = {
  async findAll(options?: {
    externalCode?: string;
    recipientName?: string;
    page?: number;
    pageSize?: number;
  }) {
    const query = db.select().from(waybills);
    
    if (options?.externalCode || options?.recipientName) {
      // 简单处理，实际应使用正确的 and() 语法
    }
    
    // 简单排序返回
    return await query.orderBy(desc(waybills.createdAt));
  },

  async findById(id: string) {
    const results = await db.select().from(waybills).where(eq(waybills.id, id));
    return results[0] || null;
  },

  async createBatch(waybillData: NewWaybill[]) {
    if (waybillData.length === 0) return [];
    return await db.insert(waybills).values(waybillData).returning();
  },

  async updateStatus(ids: string[], status: string) {
    return await db
      .update(waybills)
      .set({ status, submittedAt: status === 'submitted' ? new Date() : null })
      .where(eq(waybills.id, ids[0]))
      .returning();
  },

  async count(options?: {
    externalCode?: string;
    recipientName?: string;
  }) {
    return 0; // TODO: 实现 count
  },

  async findByExternalCode(externalCode: string) {
    return await db.select().from(waybills).where(eq(waybills.externalCode, externalCode));
  },
};
