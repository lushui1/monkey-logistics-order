/**
 * 数据校验模块
 * 
 * 验证导入的订单数据是否符合要求
 */

import type { ParsedOrder, ValidationError, ValidationResult } from '@/types/rule-engine';

/**
 * 电话格式校验
 */
function validatePhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  const phoneRegex = /^1[3-9]\d{9}$/; // 中国大陆手机号
  const telRegex = /^0\d{2,3}-?\d{7,8}$/; // 座机号
  
  return phoneRegex.test(phone.replace(/\s|-/g, '')) || telRegex.test(phone);
}

/**
 * 数量校验
 */
function validateQuantity(quantity: number | null | undefined): boolean {
  if (quantity === null || quantity === undefined) return false;
  return Number.isInteger(quantity) && quantity > 0;
}

/**
 * 温层校验
 */
function validateTemperatureLayer(value: string | null | undefined): boolean {
  if (!value) return true; // 温层可选
  
  const validLayers = ['常温', '冷藏', '冷冻', '恒温', '深冷'];
  return validLayers.includes(value);
}

/**
 * 收货信息 A 组/B组校验
 */
function validateReceiverInfo(order: ParsedOrder): { valid: boolean; error?: string } {
  // A 组：收货门店
  const hasStore = !!order.storeName;
  
  // B 组：收件人 + 电话 + 地址
  const hasRecipientName = !!order.recipientName;
  const hasRecipientPhone = !!order.recipientPhone;
  const hasRecipientAddress = !!order.recipientAddress;
  
  const hasGroupB = hasRecipientName && hasRecipientPhone && hasRecipientAddress;
  
  // 两组至少填一组
  if (hasStore || hasGroupB) {
    // 如果填了 B 组，校验电话格式
    if (hasRecipientPhone && !validatePhone(order.recipientPhone)) {
      return {
        valid: false,
        error: '收件人电话格式不正确',
      };
    }
    return { valid: true };
  }
  
  return {
    valid: false,
    error: '请填写收货门店（A 组）或收件人信息（B 组：姓名 + 电话 + 地址）',
  };
}

/**
 * 单个订单校验
 */
export function validateOrder(order: ParsedOrder, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // 必填字段校验
  if (!order.skuCode) {
    errors.push({
      row: rowIndex,
      field: 'skuCode',
      message: 'SKU 物品编码必填',
      value: order.skuCode,
    });
  }

  if (!order.skuName) {
    errors.push({
      row: rowIndex,
      field: 'skuName',
      message: 'SKU 物品名称必填',
      value: order.skuName,
    });
  }

  if (!validateQuantity(order.skuQuantity)) {
    errors.push({
      row: rowIndex,
      field: 'skuQuantity',
      message: 'SKU 发货数量必须为正整数',
      value: order.skuQuantity,
    });
  }

  // 收货信息校验
  const receiverResult = validateReceiverInfo(order);
  if (!receiverResult.valid) {
    errors.push({
      row: rowIndex,
      field: 'storeName',
      message: receiverResult.error!,
      value: order.storeName || order.recipientName,
    });
  }

  // 电话格式校验（如果有）
  if (order.recipientPhone && !validatePhone(order.recipientPhone)) {
    errors.push({
      row: rowIndex,
      field: 'recipientPhone',
      message: '收件人电话格式不正确',
      value: order.recipientPhone,
    });
  }

  return errors;
}

/**
 * 批量校验订单数据
 */
export function validateOrders(orders: ParsedOrder[]): ValidationResult {
  const allErrors: ValidationError[] = [];

  // 逐行校验
  for (let i = 0; i < orders.length; i++) {
    const errors = validateOrder(orders[i], i + 1);
    allErrors.push(...errors);
  }

  // 外部编码重复检测（同批次内）
  const externalCodeMap = new Map<string | null, number[]>();
  
  for (let i = 0; i < orders.length; i++) {
    const code: string | null = orders[i].externalCode || null;
    if (!externalCodeMap.has(code)) {
      externalCodeMap.set(code, []);
    }
    externalCodeMap.get(code)!.push(i + 1);
  }

  for (const [code, rows] of externalCodeMap.entries()) {
    if (rows.length > 1 && code !== null) {
      for (const row of rows) {
        allErrors.push({
          row,
          field: 'externalCode',
          message: `外部编码 "${code}" 重复，与第 ${rows.filter(r => r !== row).join(', ')} 行重复`,
          value: code,
        });
      }
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * 格式化错误信息用于展示
 */
export function formatErrorsForDisplay(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    messages.push(`第${error.row}行：${error.field} - ${error.message}`);
  }

  return messages;
}
