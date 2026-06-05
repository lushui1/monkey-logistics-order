import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({ error: 'fileId 必填' }, { status: 400 });
    }

    // 读取文件
    const filePath = join(process.cwd(), 'uploads', fileId);
    const fileBuffer = await readFile(filePath);

    // 解析 Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 转换成订单数据（假设前 10 行是表头，从第 11 行开始是数据）
    const orders = data.slice(10).filter(row => row.length > 0).map((row: any[]) => ({
      externalCode: row[0] || '',
      storeName: row[1] || '',
      recipientName: row[2] || '',
      recipientPhone: String(row[3] || ''),
      recipientAddress: row[4] || '',
      skuCode: row[5] || '',
      skuName: row[6] || '',
      skuQuantity: Number(row[7]) || 0,
      skuSpec: row[8] || '',
      remark: row[9] || '',
    }));

    return NextResponse.json({ 
      fileName: fileId,
      total: orders.length,
      data: orders.slice(0, 50) // 只返回前 50 条用于预览
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '解析失败' },
      { status: 500 }
    );
  }
}
