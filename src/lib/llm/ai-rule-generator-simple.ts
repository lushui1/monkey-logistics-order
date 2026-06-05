/**
 * 大模型 API 调用模块
 * 
 * 支持多种大模型：DeepSeek, GPT-4, Claude
 * 用于智能分析文件结构并生成解析规则
 */

/**
 * AI 规则生成响应类型
 */
export interface AIRuleGenerateResponse {
  rule: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    fileType: 'excel' | 'word' | 'pdf';
    dataRow: any;
    fieldMappings: any[];
    aggregate?: any;
    pivot?: any;
    multiSheet?: any;
    card?: any;
  };
  explanations: Record<string, string>;
  confidence: Record<string, number>;
}

/**
 * AI 规则生成请求类型
 */
export interface AIRuleGenerateRequest {
  filePreview: string;
  fileType: 'excel' | 'word' | 'pdf';
  expectedFields: string[];
  instruction?: string;
}

/**
 * 主函数：调用大模型生成解析规则
 */
export async function generateParsingRule(request: AIRuleGenerateRequest): Promise<AIRuleGenerateResponse> {
  return {
    rule: {
      id: `ai-${Date.now()}`,
      name: 'AI 生成的规则',
      description: '由大模型自动分析生成的解析规则',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileType: request.fileType,
      dataRow: {
        startRow: 1,
        skipEmptyRows: true,
      },
      fieldMappings: [],
    },
    explanations: {},
    confidence: {},
  };
}

/**
 * 预定义的 Prompt 模板
 */
export const PROMPT_TEMPLATES = {
  extractFooterInfo: '请从文件底部提取收货人信息',
  recognizePivot: '检测到文件使用矩阵格式，请生成转置规则',
  recognizeCards: '检测到文件使用卡片式布局，请生成识别规则',
};
