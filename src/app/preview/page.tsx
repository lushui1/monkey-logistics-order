'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedOrder } from '@/types/rule-engine';

const COLUMNS = [
  { key: 'externalCode', label: '外部编码', width: 120 },
  { key: 'storeName', label: '收货门店', width: 150 },
  { key: 'recipientName', label: '收件人', width: 100 },
  { key: 'recipientPhone', label: '电话', width: 130 },
  { key: 'recipientAddress', label: '地址', width: 200 },
  { key: 'skuCode', label: 'SKU 编码', width: 120, required: true },
  { key: 'skuName', label: 'SKU 名称', width: 150, required: true },
  { key: 'skuQuantity', label: '数量', width: 80, required: true },
  { key: 'skuSpec', label: '规格', width: 100 },
  { key: 'remark', label: '备注', width: 120 },
];

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileId = searchParams.get('fileId');
  
  const [data, setData] = useState<ParsedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);

  useEffect(() => {
    if (fileId) {
      fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })
      .then(res => res.json())
      .then(result => {
        if (result.error) throw new Error(result.error);
        setData(result.data || []);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
    }
  }, [fileId]);

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: field === 'skuQuantity' ? Number(value) : value };
    setData(newData);
  };

  const handleSubmit = async () => {
    if (data.length === 0) {
      toast.error('没有数据可提交');
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
      toast.success(`成功提交 ${data.length} 条订单！`);
      setTimeout(() => router.push('/waybills'), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在解析文件...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 顶部栏 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
                <ArrowLeft size={18} /> 返回
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">数据预览</h1>
                <p className="text-sm text-gray-500">共 {data.length} 条记录</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
                <Download size={18} /> 导出
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={submitting || data.length === 0}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 disabled:opacity-50"
              >
                <CheckCircle size={18} /> {submitting ? '提交中...' : `提交下单 (${data.length}条)`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full" style={{ tableLayout: 'fixed', minWidth: COLUMNS.reduce((sum, col) => sum + col.width, 0) + 60 }}>
              <colgroup>
                {COLUMNS.map(col => <col key={col.key} style={{ width: col.width }} />)}
                <col style={{ width: 50 }} />
              </colgroup>
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {COLUMNS.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-r border-gray-200 last:border-r-0">
                      {col.label}{col.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  <th className="px-4 py-3 border-b border-gray-200 w-[50px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-cyan-50/50 bg-white">
                    {COLUMNS.map(col => {
                      const isEditing = editingCell?.row === rowIndex && editingCell?.field === col.key;
                      return (
                        <td key={col.key} className="px-4 py-2 border-b border-r border-gray-200 last:border-r-0">
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-full px-2 py-1.5 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              value={String(row[col.key as keyof ParsedOrder] || '')}
                              onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                            />
                          ) : (
                            <div 
                              onClick={() => setEditingCell({ row: rowIndex, field: col.key })}
                              className="text-sm text-gray-900 min-h-[28px] cursor-pointer"
                            >
                              {String(row[col.key as keyof ParsedOrder] || '-')}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 border-b">
                      <button onClick={() => {}} className="p-1.5 hover:bg-red-50 rounded">
                        <X size={16} className="text-gray-400 hover:text-red-500" />
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
