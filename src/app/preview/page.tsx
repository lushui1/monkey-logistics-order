'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { validateOrders } from '@/lib/validation';
import type { ParsedOrder, ValidationError } from '@/types/rule-engine';

const COLUMNS = [
  { key: 'externalCode', label: '外部编码', width: 120 },
  { key: 'storeName', label: '收货门店', width: 150 },
  { key: 'recipientName', label: '收件人', width: 100 },
  { key: 'recipientPhone', label: '电话', width: 130 },
  { key: 'recipientAddress', label: '收货地址', width: 200 },
  { key: 'skuCode', label: 'SKU 编码', width: 120, required: true },
  { key: 'skuName', label: 'SKU 名称', width: 150, required: true },
  { key: 'skuQuantity', label: '数量', width: 80, required: true },
  { key: 'skuSpec', label: '规格', width: 100 },
  { key: 'remark', label: '备注', width: 120 },
];

function PreviewContent() {
  const router = useRouter();
  const [data, setData] = useState<ParsedOrder[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const mockData = generateMockData(30);
    setData(mockData);
    const result = validateOrders(mockData);
    setErrors(result.errors);
  }, []);

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: field === 'skuQuantity' ? Number(value) : value };
    setData(newData);
    const result = validateOrders(newData);
    setErrors(result.errors);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setData(data.filter((_, i) => i !== rowIndex));
    toast.success('已删除');
  };

  const handleAddRow = () => {
    setData([...data, { skuCode: '', skuName: '', skuQuantity: 1 }]);
  };

  const handleSubmit = async () => {
    const result = validateOrders(data);
    if (!result.valid) {
      toast.error(`存在 ${result.errors.length} 个错误`);
      result.errors.slice(0, 3).forEach(e => toast.error(`第${e.row}行：${e.message}`));
      if (result.errors.length > 3) toast.info(`还有 ${result.errors.length - 3} 个错误`);
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
      toast.success(resData.message || '提交成功！');
      setTimeout(() => router.push('/waybills'), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getCellErrors = (row: number, field: string) => errors.filter(e => e.row === row && e.field === field);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 顶部栏 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 text-gray-700">
                <ArrowLeft size={18} /> 返回
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">数据预览</h1>
                <p className="text-sm text-gray-500">共 {data.length} 条记录 {errors.length > 0 && <span className="text-red-500">· {errors.length} 个错误</span>}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddRow} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 text-gray-700">
                <Plus size={18} /> 添加行
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={submitting || errors.length > 0}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <CheckCircle size={18} /> {submitting ? '提交中...' : '提交下单'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {errors.length > 0 && (
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-2">发现 {errors.length} 个错误需要修正</h3>
                <div className="max-h-32 overflow-auto text-sm text-red-700 space-y-1">
                  {errors.slice(0, 5).map((error, i) => (
                    <div key={i}>· 第{error.row}行 {error.field}：{error.message}</div>
                  ))}
                  {errors.length > 5 && <div className="text-red-600">... 还有 {errors.length - 5} 个错误</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: COLUMNS.reduce((sum, col) => sum + col.width, 0) + 60 }}>
              <colgroup>
                {COLUMNS.map(col => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
                <col style={{ width: 50 }} />
              </colgroup>
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {COLUMNS.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                      {col.label}{col.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 w-[50px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => {
                  const rowErrors = errors.filter(e => e.row === rowIndex + 1);
                  return (
                    <tr key={rowIndex} className={`hover:bg-cyan-50/50 ${rowErrors.length > 0 ? 'bg-red-50' : 'bg-white'}`}>
                      {COLUMNS.map(col => {
                        const cellErrs = getCellErrors(rowIndex + 1, col.key);
                        const isEditing = editingCell?.row === rowIndex && editingCell?.field === col.key;
                        return (
                          <td key={col.key} className={`px-4 py-2 border-b border-r border-gray-200 last:border-r-0 ${cellErrs.length > 0 ? 'bg-red-50' : ''}`}>
                            {isEditing ? (
                              <input
                                autoFocus
                                className="w-full px-2 py-1.5 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                value={String(row[col.key as keyof ParsedOrder] || '')}
                                onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                                onBlur={() => setEditingCell(null)}
                              />
                            ) : (
                              <div 
                                onClick={() => setEditingCell({ row: rowIndex, field: col.key })}
                                className="text-sm text-gray-900 min-h-[28px] cursor-pointer flex items-center"
                              >
                                {String(row[col.key as keyof ParsedOrder] || '-')}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 border-b border-gray-200">
                        <button onClick={() => handleDeleteRow(rowIndex)} className="p-1.5 hover:bg-red-100 rounded transition-colors">
                          <X size={16} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-500">加载中...</div>}>
      <PreviewContent />
    </Suspense>
  );
}

function generateMockData(count: number): ParsedOrder[] {
  return Array.from({ length: count }, (_, i) => ({
    externalCode: `SO20260605${String(i + 1).padStart(4, '0')}`,
    storeName: ` ${(i % 5) + 1}号店`,
    recipientName: `用户${i + 1}`,
    recipientPhone: `1380013800${i % 10}`,
    recipientAddress: `北京市朝阳区路${i + 1}号`,
    skuCode: `SKU${String((i % 20) + 1).padStart(5, '0')}`,
    skuName: `商品${(i % 20) + 1}`,
    skuQuantity: Math.floor(Math.random() * 10) + 1,
    skuSpec: '标准装',
    remark: '',
  }));
}
