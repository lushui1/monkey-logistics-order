import { NextRequest, NextResponse } from 'next/server';
import { parsingRulesRepository } from '@/lib/db/repository';

/**
 * GET /api/rules
 * 
 * 获取规则列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileType = searchParams.get('fileType');

    let rules;
    if (fileType) {
      rules = await parsingRulesRepository.findByFileType(fileType);
    } else {
      rules = await parsingRulesRepository.findAll();
    }

    return NextResponse.json({ data: rules });
  } catch (error) {
    console.error('查询规则失败:', error);
    
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules
 * 
 * 创建规则
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, fileType, ruleConfig } = body;

    if (!name || !fileType || !ruleConfig) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const rule = await parsingRulesRepository.create({
      id: `RULE${Date.now()}`,
      name,
      description: description || '',
      fileType,
      ruleConfig: JSON.stringify(ruleConfig),
    });

    return NextResponse.json({ data: rule });
  } catch (error) {
    console.error('创建规则失败:', error);
    
    return NextResponse.json(
      { error: '创建规则失败' },
      { status: 500 }
    );
  }
}
