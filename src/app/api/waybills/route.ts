import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: [], total: 0 });
}

export async function POST(request: NextRequest) {
  try {
    const { orders } = await request.json();
    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: '订单数据格式错误' }, { status: 400 });
    }

    console.log('收到订单:', orders.length);

    // TODO: 保存到数据库
    
    return NextResponse.json({ 
      success: true,
      message: `成功提交 ${orders.length} 条订单`,
      count: orders.length
    });
  } catch (error) {
    console.error('Waybill error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '提交失败' },
      { status: 500 }
    );
  }
}
