/**
 * 解析规则引擎类型定义
 * 
 * 设计目标：
 * 1. 通用性：支持 9 种完全不同的文件格式
 * 2. 可扩展：新增格式只需配置规则，无需改代码
 * 3. AI友好：规则结构清晰，便于大模型生成和理解
 */

/**
 * 字段映射类型
 */
export type FieldType = 
  | 'externalCode'      // 外部编码
  | 'storeName'         // 收货门店
  | 'recipientName'     // 收件人姓名
  | 'recipientPhone'    // 收件人电话
  | 'recipientAddress'  // 收件人地址
  | 'skuCode'           // SKU 物品编码
  | 'skuName'           // SKU 物品名称
  | 'skuQuantity'       // SKU 发货数量
  | 'skuSpec'           // SKU 规格型号
  | 'remark'            // 备注
  | 'static'            // 静态值（用于填充固定值）
  | 'skip';             // 跳过（用于干扰行）

/**
 * 数据源类型
 */
export type SourceType = 
  | 'cell'              // 单元格值
  | 'row'               // 整行
  | 'column'            // 整列
  | 'header'            // 表头
  | 'footer'            // 底部区域
  | 'sheet'             // Sheet 元信息
  | 'regex';            // 正则提取

/**
 * 单元格定位方式
 */
export interface CellLocator {
  type: 'row-col' | 'range' | 'regex' | 'keyword';
  // row-col 模式
  row?: number | string;        // 行号（数字）或相对位置（'first', 'last', 'after:keyword'）
  col?: number | string;        // 列号（数字）或相对位置（'first', 'last', 'after:keyword'）
  // range 模式
  rowStart?: number;
  rowEnd?: number;
  colStart?: number;
  colEnd?: number;
  // regex 模式
  pattern?: string;             // 正则表达式
  group?: number;               // 捕获组索引
  // keyword 模式
  keyword?: string;             // 定位关键词
  offset?: number;              // 相对关键词的偏移量
}

/**
 * 字段映射规则
 */
export interface FieldMapping {
  field: FieldType;             // 目标字段
  source: SourceType;           // 数据源类型
  locator: CellLocator;         // 定位规则
  transform?: TransformRule;    // 转换规则
  required?: boolean;           // 是否必填
  defaultValue?: string | number; // 默认值
}

/**
 * 值转换规则
 */
export interface TransformRule {
  type: 'trim' | 'number' | 'concat' | 'split' | 'regex' | 'map' | 'default';
  // split: 拆分单元格内容
  delimiter?: string;           // 拆分分隔符
  index?: number;               // 拆分后取第几个
  // regex: 正则提取
  pattern?: string;
  group?: number;
  // map: 值映射
  map?: Record<string, string>;
  // concat: 拼接
  fields?: string[];
  separator?: string;
  // default: 默认值
  value?: string | number;
}

/**
 * 数据行识别规则
 */
export interface DataRowRule {
  // 方式 1：固定行范围
  startRow?: number | { after: string; offset: number };  // 数据起始行
  endRow?: number | { before: string; offset: number };   // 数据结束行
  // 方式 2：通过关键词识别
  startKeyword?: string;        // 起始关键词（如"序号"、"SKU"）
  endKeyword?: string;          // 结束关键词（如"合计"、"总计"）
  // 方式 3：通过正则识别数据行
  rowPattern?: string;          // 数据行的正则特征
  // 跳过空行
  skipEmptyRows?: boolean;
  // 跳过特定行
  skipRows?: number[];
  // 跳过的关键词
  skipKeywords?: string[];
}

/**
 * 聚合规则（用于跨行聚合场景）
 */
export interface AggregateRule {
  groupBy: FieldType;           // 按哪个字段分组（如 externalCode）
  merge: {                      // 需要合并的字段
    field: FieldType;
    strategy: 'first' | 'last' | 'concat' | 'sum';
    delimiter?: string;
  }[];
}

/**
 * 矩阵转置规则（用于门店 ×SKU 矩阵场景）
 */
export interface PivotRule {
  rowDimension: {               // 行维度（如 SKU）
    field: FieldType;
    locator: CellLocator;
  };
  columnDimension: {            // 列维度（如门店名）
    locator: CellLocator;       // 定位列头的规则
  };
  valueField: {                 // 值（如数量）
    locator: {
      type: 'relative';
      rowOffset: number;        // 相对于列头的行偏移
      colOffset: number;        // 相对于列头的列偏移
    };
  };
  outputFormat: 'row-per-cell' | 'row-per-dimension'; // 输出格式
}

/**
 * 卡片式记录规则（用于非标准表格场景）
 */
export interface CardRule {
  cardStartPattern: string;     // 卡片起始标志（如"▶ 调拨记录 #N"）
  cardEndPattern?: string;      // 卡片结束标志（可选）
  fields: {                     // 卡片内字段定位
    field: FieldType;
    locator: {
      type: 'relative-to-card' | 'regex';
      keyword?: string;         // 相对关键词
      offset?: number;          // 偏移行数
      pattern?: string;         // 正则提取
      group?: number;
    };
  }[];
}

/**
 * 多 Sheet 处理规则
 */
export interface MultiSheetRule {
  sheets: 'all' | string[];     // 处理的 Sheet 列表
  mergeStrategy: 'concat' | 'union'; // 合并策略
  sheetNameField?: FieldType;   // 是否将 Sheet 名作为字段
}

/**
 * 复合单元格拆分规则
 */
export interface ComplexCellRule {
  field: FieldType;             // 需要拆分的字段
  delimiter: '\n' | ';' | ',';  // 分隔符
  itemPattern?: string;         // 单个物品的模式（如"物品名 x 数量"）
  extract: {                    // 从每个物品中提取的字段
    targetField: FieldType;
    pattern: string;
    group: number;
  }[];
}

/**
 * 解析规则配置（完整规则）
 */
export interface ParsingRule {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  // 文件类型
  fileType: 'excel' | 'word' | 'pdf';
  
  // Sheet 选择（Excel）
  sheet?: string | number;
  
  // 数据行识别
  dataRow: DataRowRule;
  
  // 字段映射（核心）
  fieldMappings: FieldMapping[];
  
  // 可选：聚合规则
  aggregate?: AggregateRule;
  
  // 可选：矩阵转置规则
  pivot?: PivotRule;
  
  // 可选：卡片式记录规则
  card?: CardRule;
  
  // 可选：多 Sheet 规则
  multiSheet?: MultiSheetRule;
  
  // 可选：复合单元格拆分
  complexCell?: ComplexCellRule;
  
  // 元数据提取（如从文件名、底部提取信息）
  metadata?: {
    source: 'file' | 'footer' | 'header';
    field: string;
    locator: CellLocator;
  }[];
}

/**
 * 解析结果
 */
export interface ParsingResult {
  success: boolean;
  data: ParsedOrder[];
  errors: ParseError[];
  warnings: string[];
  // 用于 AI 辅助生成规则时，标记哪些字段是 AI 推测的
  confidence?: Record<string, number>;
}

/**
 * 解析后的订单数据
 */
export interface ParsedOrder {
  externalCode?: string | null;      // 外部编码
  storeName?: string | null;         // 收货门店
  recipientName?: string | null;     // 收件人姓名
  recipientPhone?: string | null;    // 收件人电话
  recipientAddress?: string | null;  // 收件人地址
  skuCode: string;                   // SKU 物品编码
  skuName: string;                   // SKU 物品名称
  skuQuantity: number;               // SKU 发货数量
  skuSpec?: string | null;           // SKU 规格型号
  remark?: string | null;            // 备注
}

/**
 * 解析错误
 */
export interface ParseError {
  row?: number;
  field?: string;
  message: string;
  rawValue?: string;
}

/**
 * AI Rule Generation Request
 */
export interface AIRuleGenerationRequest {
  filePreview: string;
  fileType: 'excel' | 'word' | 'pdf';
  expectedFields: string[];
  instruction?: string;
}

/**
 * AI Rule Generation Response  
 */
export interface AIRuleGenerationResponse {
  rule: ParsingRule;
  explanations: Record<string, string>;
  confidence: Record<string, number>;
}

// Aliases for backward compatibility
export type AIRuleGenerateRequest = AIRuleGenerationRequest;
export type AIRuleGenerateResponse = AIRuleGenerationResponse;

/**
 * AI 规则生成响应
 */
export interface AI规则生成响应 {
  rule: ParsingRule;                // 生成的规则
  explanations: Record<string, string>; // 字段映射解释
  confidence: Record<string, number>;   // 信心分数
}

/**
 * 数据验证错误
 */
export interface ValidationError {
  row: number;
  field: keyof ParsedOrder;
  message: string;
  value: any;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
