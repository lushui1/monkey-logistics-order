import { NextRequest, NextResponse } from 'next/server';
import { waybillsRepository } from '@/lib/db/repository';
import { validateOrders } from '@/lib/validation';

/**
 * POST /api/waybills
 * 
 * 批量提交运单
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orders } = body;

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: '无效的订单数据' },
        { status: 400 }
      );
    }

    // 校验
    const validation = validateOrders(orders);
    if (!validation.valid) {
      return NextResponse.json(
        { error: '数据校验失败', errors: validation.errors },
        { status: 400 }
      );
    }

    // 批量插入数据库
    const insertedOrders = await waybillsRepository.createBatch(
      orders.map(order => ({
        ...order,
        id: `WB${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending',
      }))
    );

    return NextResponse.json({
      success: true,
      count: insertedOrders.length,
      message: `成功提交 ${insertedOrders.length} 条运单`,
    });
  } catch (error) {
    console.error('运单创建失败:', error);
    
    return NextResponse.json(
      { error: '创建运单失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/waybills
 * 
 * 查询运单列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const externalCode = searchParams.get('externalCode') || '';
    const recipientName = searchParams.get('recipientName') || '';

    const waybills = await waybillsRepository.findAll({
      page,
      pageSize,
      externalCode: externalCode || undefined,
      recipientName: recipientName || undefined,
    });

    const total = await waybillsRepository.count({
      externalCode: externalCode || undefined,
      recipientName: recipientName || undefined,
    });

    return NextResponse.json({
      data: waybills,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('查询运单失败:', error);
    
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}
