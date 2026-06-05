'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircle, AlertCircle, X, Plus, Trash2, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { validateOrders } from '@/lib/validation';
import type { ParsedOrder, ValidationError } from '@/types/rule-engine';

const COLUMNS = [
  { key: 'externalCode', label: '外部编码', width: 120, required: false },
  { key: 'storeName', label: '收货门店', width: 180, required: false },
  { key: 'recipientName', label: '收件人', width: 100, required: false },
  { key: 'recipientPhone', label: '电话', width: 130, required: false },
  { key: 'recipientAddress', label: '收货地址', width: 250, required: false },
  { key: 'skuCode', label: 'SKU 编码', width: 120, required: true },
  { key: 'skuName', label: 'SKU 名称', width: 150, required: true },
  { key: 'skuQuantity', label: '数量', width: 80, required: true },
  { key: 'skuSpec', label: '规格型号', width: 120, required: false },
  { key: 'remark', label: '备注', width: 150, required: false },
];

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ParsedOrder[]>([]);
  const [editingCell, setEditingCell] = useState<null | { row: number; field: string }>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const mockData = generateMockData(50);
    setData(mockData);
    const result = validateOrders(mockData);
    setErrors(result.errors.map(e => ({ ...e, row: e.row })));
  }, []);

  const errorRows = useMemo(() => {
    const rows = new Set<number>();
    errors.forEach(e => rows.add(e.row));
    return rows;
  }, [errors]);

  const getCellErrors = (rowIndex: number, field: string) => errors.filter(e => e.row === rowIndex && e.field === field);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  const handleCellClick = (rowIndex: number, field: string) => setEditingCell({ row: rowIndex, field });

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: field === 'skuQuantity' ? Number(value) : value };
    setData(newData);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setData(data.filter((_, i) => i !== rowIndex));
    toast.success('已删除该行');
  };

  const handleAddRow = () => {
    setData([...data, { skuCode: '', skuName: '', skuQuantity: 1 }]);
    toast.success('已添加空行');
  };

  const handleExport = () => toast.info('导出功能开发中');

  const handleSubmit = async () => {
    const result = validateOrders(data);
    if (!result.valid) {
      toast.error(`存在 ${result.errors.length} 个错误，请修正后提交`);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/waybills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: data }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || '提交失败');
      toast.success(responseData.message || '提交成功！');
      router.push('/waybills');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">数据预览</h1>
            <p className="text-sm text-[#64748b]">共 {data.length} 条记录{errors.length > 0 && <span className="text-[#ef4444]"> · {errors.length} 个错误待修正</span>}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddRow} className="btn-secondary"><Plus className="w-4 h-4" /> 添加行</button>
          <button onClick={handleExport} className="btn-secondary"><Download className="w-4 h-4" /> 导出 Excel</button>
          <button onClick={handleSubmit} disabled={submitting || errors.length > 0} className="btn-primary">
            <CheckCircle className="w-4 h-4" /> {submitting ? '提交中...' : '提交下单'}
          </button>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="card p-0 overflow-hidden shadow-sm">
        {/* 表头 */}
        <div className="border-b-2 border-[#e2e8f0] bg-[#f8fafc]">
          <div className="flex" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map(col => (
              <div key={col.key} className="font-semibold text-[#0f172a] px-4 py-3 border-r border-[#e2e8f0]" style={{ width: col.width }}>
                {col.label}{col.required && <span className="text-[#ef4444] ml-1">*</span>}
              </div>
            ))}
            <div className="w-10" />
          </div>
        </div>

        {/* 表格内容 */}
        <div ref={parentRef} className="h-[600px] overflow-auto bg-white">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: 'max-content' }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const rowIndex = virtualRow.index;
              const rowData = data[rowIndex];
              const hasError = errorRows.has(rowIndex + 1);
              return (
                <div
                  key={virtualRow.key}
                  className={`flex border-b border-[#e2e8f0] hover:bg-[#e0f7f6] ${hasError ? 'bg-[#fee2e2]' : 'bg-white'}`}
                  style={{ position: 'absolute', top: 0, left: 0, width: 'max-content', transform: `translateY(${virtualRow.start}px)` }}
                >
                  {COLUMNS.map(col => {
                    const isEditing = editingCell?.row === rowIndex && editingCell?.field === col.key;
                    return (
                      <div key={col.key} className="px-4 py-2 border-r border-[#e2e8f0]" style={{ width: col.width }}>
                        {isEditing ? (
                          <input
                            type={col.key === 'skuQuantity' ? 'number' : 'text'}
                            value={String(rowData[col.key as keyof ParsedOrder] || '')}
                            onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="input p-1 text-sm"
                          />
                        ) : (
                          <div onClick={() => handleCellClick(rowIndex, col.key)} className="text-sm text-[#0f172a] cursor-pointer hover:bg-[#f1f5f9] min-h-[28px]">
                            {String(rowData[col.key as keyof ParsedOrder] || '-')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="w-10 flex items-center justify-center">
                    <button onClick={() => handleDeleteRow(rowIndex)} className="p-1 hover:text-[#ef4444]">
                      <X className="w-4 h-4 text-[#64748b]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="card bg-[#fee2e2] border-[#fecaca]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-[#991b1b] mb-2">发现 {errors.length} 个错误</h3>
              <div className="max-h-32 overflow-auto text-sm text-[#991b1b] space-y-1">
                {errors.slice(0, 5).map((error, i) => (
                  <div key={i}>· 第{error.row}行：{error.field} - {error.message}</div>
                ))}
                {errors.length > 5 && <div>... 还有 {errors.length - 5} 个错误</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="loading-spinner" /></div>}>
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
