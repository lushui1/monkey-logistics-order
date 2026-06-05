'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Download, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { validateOrders } from '@/lib/validation';
import type { ParsedOrder } from '@/types/rule-engine';

const COLUMNS = [
  { key: 'externalCode', label: '外部编码', width: 120 },
  { key: 'storeName', label: '收货门店', width: 150 },
  { key: 'recipientName', label: '收件人', width: 100 },
  { key: 'recipientPhone', label: '电话', width: 130 },
  { key: 'recipientAddress', label: '收货地址', width: 220 },
  { key: 'skuCode', label: 'SKU 编码', width: 120, required: true },
  { key: 'skuName', label: 'SKU 名称', width: 150, required: true },
  { key: 'skuQuantity', label: '数量', width: 80, required: true },
  { key: 'skuSpec', label: '规格', width: 100 },
  { key: 'remark', label: '备注', width: 150 },
];

function PreviewContent() {
  const router = useRouter();
  const [data, setData] = useState<ParsedOrder[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const mockData = generateMockData(20);
    setData(mockData);
  }, []);

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: field === 'skuQuantity' ? Number(value) : value };
    setData(newData);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setData(data.filter((_, i) => i !== rowIndex));
  };

  const handleAddRow = () => {
    setData([...data, { skuCode: '', skuName: '', skuQuantity: 1 }]);
  };

  const handleSubmit = async () => {
    const result = validateOrders(data);
    if (!result.valid) {
      toast.error(`存在 ${result.errors.length} 个错误，请修正后提交`);
      result.errors.forEach(e => toast.error(`第${e.row}行：${e.field} - ${e.message}`));
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/waybills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: data }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || '提交失败');
      toast.success(resData.message || '提交成功！即将跳转...');
      setTimeout(() => router.push('/waybills'), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部操作栏 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
              <ArrowLeft size={18} /> 返回
            </button>
            <div>
              <h1 className="text-lg font-semibold">数据预览</h1>
              <p className="text-sm text-gray-500">共 {data.length} 条记录</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAddRow} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
              <Plus size={18} /> 添加行
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50">
              <CheckCircle size={18} /> {submitting ? '提交中...' : '提交下单'}
            </button>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {COLUMNS.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r last:border-r-0 whitespace-nowrap" style={{ width: col.width }}>
                      {col.label}{col.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b w-12">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-cyan-50/30">
                    {COLUMNS.map(col => {
                      const isEditing = editingCell?.row === rowIndex && editingCell?.field === col.key;
                      return (
                        <td key={col.key} className="px-4 py-2 border-b border-r last:border-r-0" onClick={() => !isEditing && handleCellChange(rowIndex, col.key, String(row[col.key as keyof ParsedOrder] || ''))}>
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              value={String(row[col.key as keyof ParsedOrder] || '')}
                              onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                            />
                          ) : (
                            <div className="text-sm text-gray-900 min-h-[28px] cursor-pointer">
                              {String(row[col.key as keyof ParsedOrder] || '-')}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 border-b">
                      <button onClick={() => handleDeleteRow(rowIndex)} className="p-1 hover:bg-red-50 rounded">
                        <X size={16} className="text-gray-500 hover:text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
      <PreviewContent />
    </Suspense>
  );
}

function generateMockData(count: number): ParsedOrder[] {
  return Array.from({ length: count }, (_, i) => ({
    externalCode: `SO20260605${String(i + 1).padStart(4, '0')}`,
    storeName: `测试门店 ${i % 5 + 1}`,
    recipientName: `测试用户${i + 1}`,
    recipientPhone: `1380013800${i % 10}`,
    recipientAddress: `北京市朝阳区测试路${i + 1}号`,
    skuCode: `SKU${String(i % 20 + 1).padStart(5, '0')}`,
    skuName: `测试商品${i % 20 + 1}`,
    skuQuantity: Math.floor(Math.random() * 10) + 1,
    skuSpec: '标准装',
    remark: '',
  }));
}
