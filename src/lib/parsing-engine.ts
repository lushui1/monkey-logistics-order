/**
 * 解析规则引擎核心实现
 * 
 * 支持 9 种复杂场景：
 * 1. 头部跳过 - 跳过文件开头的干扰信息
 * 2. 尾部信息提取 - 从底部提取收货人等散乱信息
 * 3. 跨行聚合 - 同一单号下多行共享收货信息
 * 4. 矩阵转置 - 门店×SKU 矩阵转置为独立记录
 * 5. 多 Sheet 合并 - 遍历所有 Sheet 合并解析
 * 6. 卡片式堆叠 - 非标准表格的卡片记录识别
 * 7. 纯文本解析 - Word/PDF 段落文本字段提取
 * 8. 复合单元格拆分 - 单单元格内多物品拆分
 * 9. PDF 多订单拆分 - 一个 PDF 内多个独立订单
 */

import type {
  ParsingRule,
  ParsedOrder,
  ParsingResult,
  ParseError,
  FieldMapping,
  CellLocator,
  DataRowRule,
  ComplexCellRule,
} from '@/types/rule-engine';

/**
 * Excel 数据接口（简化版 xlsx）
 */
interface ExcelData {
  sheets: string[];
  data: Record<string, any[][]>;
}

/**
 * 解析器类
 */
export class ParsingEngine {
  private rule: ParsingRule;
  private errors: ParseError[] = [];
  private warnings: string[] = [];

  constructor(rule: ParsingRule) {
    this.rule = rule;
  }

  /**
   * 执行解析
   */
  async parse(fileData: ExcelData | string): Promise<ParsingResult> {
    this.errors = [];
    this.warnings = [];

    try {
      if (this.rule.fileType === 'excel') {
        return this.parseExcel(fileData as ExcelData);
      } else if (this.rule.fileType === 'word' || this.rule.fileType === 'pdf') {
        return this.parseTextFile(fileData as string);
      } else {
        throw new Error(`Unsupported file type: ${this.rule.fileType}`);
      }
    } catch (error) {
      this.errors.push({
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        data: [],
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }

  /**
   * Excel 文件解析
   */
  private parseExcel(fileData: ExcelData): ParsingResult {
    const data: ParsedOrder[] = [];

    // 处理多 Sheet
    const sheetsToProcess = this.rule.multiSheet?.sheets === 'all'
      ? fileData.sheets
      : (this.rule.multiSheet?.sheets || [this.rule.sheet || fileData.sheets[0]]);

    for (const sheetName of sheetsToProcess) {
      const sheetData = fileData.data[sheetName];
      if (!sheetData) {
        this.warnings.push(`Sheet "${sheetName}" not found`);
        continue;
      }

      // 识别数据行范围
      const dataRows = this.identifyDataRows(sheetData);

      // 处理卡片式记录
      if (this.rule.card) {
        const cardData = this.parseCardStyle(sheetData, dataRows);
        data.push(...cardData);
      }
      // 处理矩阵转置
      else if (this.rule.pivot) {
        const pivotData = this.parsePivot(sheetData, dataRows);
        data.push(...pivotData);
      }
      // 标准表格解析
      else {
        const standardData = this.parseStandardTable(sheetData, dataRows, String(sheetName));
        data.push(...standardData);
      }
    }

    // 处理复合单元格拆分
    if (this.rule.complexCell && data.length > 0) {
      return this.processComplexCell(data);
    }

    // 处理跨行聚合
    if (this.rule.aggregate && data.length > 0) {
      return this.aggregateData(data);
    }

    return {
      success: this.errors.length === 0,
      data,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * 识别数据行范围
   */
  private identifyDataRows(sheetData: any[][]): { start: number; end: number } {
    const dataRow = this.rule.dataRow;
    let start = 0;
    let end = sheetData.length;

    // 固定行号
    if (typeof dataRow.startRow === 'number') {
      start = dataRow.startRow;
    } else if (dataRow.startRow && typeof dataRow.startRow === 'object' && 'after' in dataRow.startRow) {
      // 关键词后
      start = this.findRowByKeyword(sheetData, dataRow.startRow.after) + dataRow.startRow.offset;
    }

    if (typeof dataRow.endRow === 'number') {
      end = dataRow.endRow;
    } else if (dataRow.endRow && typeof dataRow.endRow === 'object' && 'before' in dataRow.endRow) {
      end = this.findRowByKeyword(sheetData, dataRow.endRow.before) + dataRow.endRow.offset;
    }

    // 关键词识别
    if (dataRow.startKeyword) {
      const keywordRow = this.findRowByKeyword(sheetData, dataRow.startKeyword);
      if (keywordRow >= 0) {
        start = keywordRow + 1; // 表头下一行
      }
    }

    if (dataRow.endKeyword) {
      const keywordRow = this.findRowByKeyword(sheetData, dataRow.endKeyword);
      if (keywordRow >= 0) {
        end = keywordRow;
      }
    }

    // 跳过的行
    if (dataRow.skipRows) {
      // 在解析时跳过
    }

    return { start, end };
  }

  /**
   * 通过关键词查找行
   */
  private findRowByKeyword(sheetData: any[][], keyword: string): number {
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row.some(cell => String(cell || '').includes(keyword))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 标准表格解析
   */
  private parseStandardTable(
    sheetData: any[][],
    dataRange: { start: number; end: number },
    sheetName: string
  ): ParsedOrder[] {
    const orders: ParsedOrder[] = [];
    const { start, end } = dataRange;

    // 查找表头行（用于列映射）
    const headerRow = this.findHeaderRow(sheetData, start);
    const headerMap = this.buildHeaderMap(sheetData[headerRow]);

    for (let i = start; i < end; i++) {
      // 跳过的行
      if (this.rule.dataRow.skipRows?.includes(i)) continue;

      const row = sheetData[i];
      if (!row || row.every(cell => !cell)) continue; // 跳过空行

      // 跳过的关键词
      if (this.rule.dataRow.skipKeywords?.some(kw => row.some(cell => String(cell || '').includes(kw)))) {
        continue;
      }

      try {
        const order = this.extractOrderFromRow(row, headerMap, i, sheetName);
        if (order) {
          orders.push(order);
        }
      } catch (error) {
        this.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : '解析失败',
        });
      }
    }

    return orders;
  }

  /**
   * 查找表头行
   */
  private findHeaderRow(sheetData: any[][], dataStart: number): number {
    // 简单策略：数据行上一行
    return dataStart - 1;
  }

  /**
   * 构建表头映射
   */
  private buildHeaderMap(headerRow: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    headerRow.forEach((cell, i) => {
      if (cell) {
        map[String(cell).trim()] = i;
      }
    });
    return map;
  }

  /**
   * 从行提取订单数据
   */
  private extractOrderFromRow(
    row: any[],
    headerMap: Record<string, number>,
    rowIndex: number,
    sheetName?: string
  ): ParsedOrder | null {
    const order: any = {};

    for (const mapping of this.rule.fieldMappings) {
      try {
        const value = this.extractFieldValue(row, mapping, headerMap, rowIndex);
        if (value !== undefined && value !== null) {
          order[mapping.field] = value;
        } else if (mapping.defaultValue !== undefined) {
          order[mapping.field] = mapping.defaultValue;
        }
      } catch (error) {
        if (mapping.required) {
          this.errors.push({
            row: rowIndex + 1,
            field: mapping.field,
            message: `字段提取失败：${error instanceof Error ? error.message : '未知错误'}`,
          });
        }
      }
    }

    // 必填校验
    if (!order.skuCode || !order.skuName || !order.skuQuantity) {
      return null; // 缺少核心字段，跳过此行
    }

    return order as ParsedOrder;
  }

  /**
   * 提取字段值
   */
  private extractFieldValue(
    row: any[],
    mapping: FieldMapping,
    headerMap: Record<string, number>,
    rowIndex: number
  ): any {
    const { locator, transform } = mapping;
    let rawValue: any;

    // 根据定位方式获取值
    switch (locator.type) {
      case 'row-col':
        if (typeof locator.col === 'number') {
          rawValue = row[locator.col];
        } else if (typeof locator.col === 'string' && headerMap[locator.col]) {
          rawValue = row[headerMap[locator.col]];
        }
        break;

      case 'keyword':
        if (locator.keyword) {
          const idx = row.findIndex(cell => String(cell || '').includes(String(locator.keyword)));
          if (idx >= 0 && locator.offset !== undefined) {
            rawValue = row[idx + locator.offset];
          }
        }
        break;

      case 'regex':
        if (locator.pattern) {
          const text = row.join(' | ');
          const match = text.match(new RegExp(locator.pattern));
          if (match) {
            rawValue = match[locator.group || 1];
          }
        }
        break;

      default:
        rawValue = row[0];
    }

    // 应用转换
    if (transform && rawValue !== undefined && rawValue !== null) {
      return this.applyTransform(rawValue, transform);
    }

    return rawValue;
  }

  /**
   * 应用值转换
   */
  private applyTransform(value: any, transform: any): any {
    switch (transform.type) {
      case 'trim':
        return String(value).trim();
      case 'number':
        return Number(value);
      case 'split':
        if (transform.delimiter) {
          const parts = String(value).split(transform.delimiter);
          return parts[transform.index || 0];
        }
        return value;
      case 'regex':
        if (transform.pattern) {
          const match = String(value).match(new RegExp(transform.pattern));
          return match ? match[transform.group || 1] : value;
        }
        return value;
      default:
        return value;
    }
  }

  /**
   * 卡片式记录解析
   */
  private parseCardStyle(sheetData: any[][], dataRange: { start: number; end: number }): ParsedOrder[] {
    const orders: ParsedOrder[] = [];
    const { card } = this.rule;

    if (!card) return orders;

    const cardStartRegex = new RegExp(card.cardStartPattern);
    
    for (let i = dataRange.start; i < dataRange.end; i++) {
      const row = sheetData[i];
      if (!row) continue;

      // 查找卡片起始标志
      const hasCardStart = row.some(cell => cardStartRegex.test(String(cell || '')));
      if (!hasCardStart) continue;

      // 提取卡片内字段
      const order: any = {};
      for (const fieldRule of card.fields) {
        const loc = fieldRule.locator;
        let value: any;

        if (loc.type === 'relative-to-card' && loc.keyword) {
          // 从当前卡片内相对关键词位置提取
          const keywordRowIdx = this.findRowInCard(sheetData, i, loc.keyword);
          if (keywordRowIdx >= 0 && loc.offset !== undefined) {
            const targetRow = sheetData[keywordRowIdx + loc.offset];
            if (targetRow) {
              value = targetRow[0];
            }
          }
        }

        if (value) {
          order[fieldRule.field] = value;
        }
      }

      if (order.skuCode && order.skuName) {
        orders.push(order as ParsedOrder);
      }
    }

    return orders;
  }

  /**
   * 在卡片内查找关键词行
   */
  private findRowInCard(sheetData: any[][], cardStartRow: number, keyword: string): number {
    // 简单实现：在卡片起始后 10 行内查找
    for (let i = cardStartRow; i < Math.min(cardStartRow + 10, sheetData.length); i++) {
      const row = sheetData[i];
      if (row.some(cell => String(cell || '').includes(keyword))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 矩阵转置解析
   */
  private parsePivot(sheetData: any[][], dataRange: { start: number; end: number }): ParsedOrder[] {
    const orders: ParsedOrder[] = [];
    const { pivot } = this.rule;

    if (!pivot) return orders;

    // 提取行维度（SKU 信息）
    const rowItems: any[] = [];
    for (let i = dataRange.start; i < dataRange.end; i++) {
      const row = sheetData[i];
      if (!row) continue;

      const item: any = {};
      const rowLoc = pivot.rowDimension.locator;
      if (rowLoc.type === 'row-col' && typeof rowLoc.col === 'number') {
        item.row = row[rowLoc.col];
      }
      rowItems.push({ row: i, data: item });
    }

    // 提取列维度（门店/日期）
    const headerRow = sheetData[dataRange.start - 1];
    const columns: { name: string; index: number }[] = [];
    
    // 找到列头区域
    const colLoc = pivot.columnDimension.locator;
    if (colLoc.type === 'range' && colLoc.colStart !== undefined && colLoc.colEnd !== undefined) {
      for (let j = colLoc.colStart; j <= colLoc.colEnd; j++) {
        columns.push({ name: String(headerRow[j] || `Column${j}`), index: j });
      }
    }

    // 生成转置后的记录
    for (const rowItem of rowItems) {
      for (const col of columns) {
        const order: any = { ...rowItem.data };
        
        // 提取值
        const valueLoc: any = pivot.valueField.locator;
        if (valueLoc.type === 'relative') {
          const valueRow = dataRange.start + valueLoc.rowOffset;
          const valueCol = col.index + valueLoc.colOffset;
          const cellValue = sheetData[valueRow]?.[valueCol];
          
          if (cellValue) {
            // 添加到订单
            const parsed = this.parseQuantityCell(String(cellValue));
            if (parsed) {
              order.skuQuantity = parsed.quantity;
            }
          }
        }

        if (order.skuCode && order.skuName && order.skuQuantity) {
          orders.push(order as ParsedOrder);
        }
      }
    }

    return orders;
  }

  /**
   * 解析复合单元格（如"物品名 x 数量\n物品名 x 数量"）
   */
  private parseQuantityCell(text: string): { name?: string; quantity?: number } | null {
    const match = text.match(/(.+?)x(\d+)/i);
    if (match) {
      return {
        name: match[1].trim(),
        quantity: Number(match[2]),
      };
    }
    return null;
  }

  /**
   * 处理复合单元格拆分
   */
  private processComplexCell(data: ParsedOrder[]): ParsingResult {
    const result: ParsedOrder[] = [];
    const { complexCell } = this.rule;

    if (!complexCell) {
      return {
        success: this.errors.length === 0,
        data,
        errors: this.errors,
        warnings: this.warnings,
      };
    }

    for (const order of data) {
      const cellValue = (order as any)[complexCell.field];
      if (!cellValue) {
        result.push(order);
        continue;
      }

      const items = String(cellValue).split(complexCell.delimiter);
      for (const item of items) {
        const newOrder = { ...order };
        
      for (const extract of complexCell.extract) {
        const match = item.match(new RegExp(extract.pattern));
        if (match) {
          (newOrder as any)[extract.targetField] = match[extract.group];
        }
      }

        result.push(newOrder as ParsedOrder);
      }
    }

    return {
      success: this.errors.length === 0,
      data: result,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * 跨行聚合
   */
  private aggregateData(data: ParsedOrder[]): ParsingResult {
    const { aggregate } = this.rule;

    if (!aggregate) {
      return {
        success: this.errors.length === 0,
        data,
        errors: this.errors,
        warnings: this.warnings,
      };
    }

    const groups = new Map<string, ParsedOrder[]>();
    
    // 分组
    for (const order of data) {
      const key = (order as any)[aggregate.groupBy] || '__none__';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(order);
    }

    // 合并
    const result: ParsedOrder[] = [];
    for (const [key, orders] of groups) {
      if (orders.length === 1) {
        result.push(orders[0]);
        continue;
      }

      const merged: any = { ...orders[0] };
      for (const mergeRule of aggregate.merge) {
        const values = orders.map(o => (o as any)[mergeRule.field]).filter(Boolean);
        
        switch (mergeRule.strategy) {
          case 'first':
            merged[mergeRule.field] = values[0];
            break;
          case 'last':
            merged[mergeRule.field] = values[values.length - 1];
            break;
          case 'concat':
            merged[mergeRule.field] = values.join(mergeRule.delimiter || ', ');
            break;
          case 'sum':
            merged[mergeRule.field] = values.reduce((sum, v) => sum + Number(v), 0);
            break;
        }
      }

      result.push(merged as ParsedOrder);
    }

    return {
      success: this.errors.length === 0,
      data: result,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * 文本文件解析（Word/PDF）
   */
  private parseTextFile(text: string): ParsingResult {
    const orders: ParsedOrder[] = [];
    
    if (this.rule.card?.cardStartPattern) {
      // 卡片式文本分割
      const cardRegex = new RegExp(this.rule.card.cardStartPattern, 'g');
      const parts = text.split(cardRegex).filter(Boolean);
      
      for (const part of parts) {
        const order = this.extractFromTextPart(part);
        if (order) {
          orders.push(order);
        }
      }
    } else {
      // 简单逐行解析
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const order = this.extractFromLine(lines[i], i);
        if (order) {
          orders.push(order);
        }
      }
    }

    return {
      success: this.errors.length === 0,
      data: orders,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * 从文本段落提取订单
   */
  private extractFromTextPart(text: string): ParsedOrder | null {
    const order: any = {};

    for (const mapping of this.rule.fieldMappings) {
      if (mapping.locator.type === 'regex' && mapping.locator.pattern) {
        const match = text.match(new RegExp(mapping.locator.pattern, 'i'));
        if (match) {
          const value = match[mapping.locator.group || 1];
          order[mapping.field] = this.applyTransform(value, mapping.transform!);
        }
      }
    }

    if (order.skuCode && order.skuName) {
      return order as ParsedOrder;
    }

    return null;
  }

  /**
   * 从单行文本提取
   */
  private extractFromLine(line: string, rowIndex: number): ParsedOrder | null {
    const order: any = {};
    const parts = line.split(/[|,\t]/).map(s => s.trim());

    // 简单的按分隔符解析
    for (let i = 0; i < this.rule.fieldMappings.length && i < parts.length; i++) {
      const mapping = this.rule.fieldMappings[i];
      const value = parts[i];
      if (value) {
        order[mapping.field] = this.applyTransform(value, mapping.transform!);
      }
    }

    if (order.skuCode && order.skuName) {
      return order as ParsedOrder;
    }

    return null;
  }
}

/**
 * 创建解析引擎实例
 */
export function createParsingEngine(rule: ParsingRule): ParsingEngine {
  return new ParsingEngine(rule);
}
