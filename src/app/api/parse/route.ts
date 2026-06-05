import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/file-parser';
import { generateParsingRule } from '@/lib/llm/ai-rule-generator-simple';
import { createParsingEngine } from '@/lib/parsing-engine';

/**
 * POST /api/parse
 * 
 * 解析上传的文件
 * 
 * 请求参数:
 * - file: 上传的文件
 * - mode: 'ai-generate' | 'use-rule'
 * - ruleId: 使用的规则 ID（当 mode='use-rule' 时）
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string;
    const ruleId = formData.get('ruleId') as string;

    if (!file) {
      return NextResponse.json(
        { error: '请上传文件' },
        { status: 400 }
      );
    }

    // 1. 解析文件获取原始数据
    const parseResult = await parseFile(file);
    
    // 2. AI 模式：生成规则并解析
    if (mode === 'ai-generate') {
      // 调用大模型生成规则
      const aiResult = await generateParsingRule({
        filePreview: parseResult.preview,
        fileType: parseResult.fileType,
        expectedFields: [
          'externalCode',
          'storeName',
          'recipientName',
          'recipientPhone',
          'recipientAddress',
          'skuCode',
          'skuName',
          'skuQuantity',
          'skuSpec',
          'remark',
        ],
      });

      // 使用生成的规则解析数据
      const engine = createParsingEngine(aiResult.rule);
      const result = await engine.parse(parseResult.data as any);

      return NextResponse.json({
        success: result.success,
        data: result.data,
        errors: result.errors,
        warnings: result.warnings,
        rule: aiResult.rule,
        explanations: aiResult.explanations,
        confidence: aiResult.confidence,
      });
    }

    // 3. 规则模式：使用已有规则解析
    if (mode === 'use-rule' && ruleId) {
      // TODO: 从数据库加载规则
      // const rule = await parsingRulesRepository.findById(ruleId);
      
      return NextResponse.json(
        { error: '规则模式暂未实现' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: '必须指定解析模式（ai-generate 或 use-rule）' },
      { status: 400 }
    );
  } catch (error) {
    console.error('文件解析失败:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
      { 
        error: error.message,
      },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '文件解析失败' },
      { status: 500 }
    );
  }
}
