'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircle, AlertCircle, X, Plus, Trash2, Download, Upload, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { validateOrders } from '@/lib/validation';
import type { ParsedOrder, ValidationError } from '@/types/rule-engine';

// 表格列定义
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

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<ParsedOrder[]>([]);
  const [editingCell, setEditingCell] = useState<null | { row: number; field: string }>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 模拟数据（TODO: 从 API 获取）
  useEffect(() => {
    // 实际应从 localStorage 或 API 获取解析后的数据
    const mockData = generateMockData(50);
    setData(mockData);
    
    // 初始校验
    const result = validateOrders(mockData);
    setErrors(result.errors);
    
    if (!result.valid) {
      toast.warning(`发现 ${result.errors.length} 个错误，请修正后提交`);
    }
  }, []);

  // 错误行号集合
  const errorRows = useMemo(() => {
    const rows = new Set<number>();
    errors.forEach(e => rows.add(e.row));
    return rows;
  }, [errors]);

  // 获取单元格错误
  const getCellErrors = (rowIndex: number, field: string) => {
    return errors.filter(
      e => e.row === rowIndex && e.field === field
    );
  };

  // 虚拟列表
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  const handleCellClick = (rowIndex: number, field: string) => {
    setEditingCell({ row: rowIndex, field });
  };

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [field]: field === 'skuQuantity' ? Number(value) : value,
    };
    setData(newData);
    
    // 实时校验
    const rowErrors = errors.filter(e => e.row !== rowIndex + 1);
    const validationResult = validateOrders([newData[rowIndex]]);
    rowErrors.push(...validationResult.errors.map(e => ({ ...e, row: rowIndex + 1 })));
    setErrors(rowErrors);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = data.filter((_, i) => i !== rowIndex);
    setData(newData);
    
    // 重新编号错误行号
    const adjustedErrors = errors
      .filter(e => e.row !== rowIndex + 1)
      .map(e => e.row > rowIndex + 1 ? { ...e, row: e.row - 1 } : e);
    setErrors(adjustedErrors);
    
    toast.success('已删除该行');
  };

  const handleAddRow = () => {
    const newRow: ParsedOrder = {
      skuCode: '',
      skuName: '',
      skuQuantity: 1,
    };
    setData([...data, newRow]);
    toast.success('已添加空行');
  };

  const handleExport = () => {
    // TODO: 导出为 Excel
    toast.info('导出功能开发中');
  };

  const handleSubmit = async () => {
    // 校验
    const result = validateOrders(data);
    setErrors(result.errors.map(e => ({ ...e, row: e.row })));
    
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

      if (!response.ok) {
        throw new Error('提交失败');
      }

      toast.success('提交成功！');
      router.push('/waybills');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">数据预览</h1>
            <p className="text-sm text-[#64748b]">
              共 {data.length} 条记录
              {errors.length > 0 && (
                <span className="ml-2 text-[#ef4444]">
                  · {errors.length} 个错误待修正
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleAddRow} className="btn-secondary">
            <Plus className="w-4 h-4" />
            添加行
          </button>
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" />
            导出 Excel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || errors.length > 0}
            className="btn-primary"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? '提交中...' : '提交下单'}
          </button>
        </div>
      </div>

      {/* 数据表格（虚拟列表） */}
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div className="flex" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map(col => (
              <div
                key={col.key}
                className="font-semibold text-[#0f172a] px-4 py-3 border-r border-[#e2e8f0] flex-shrink-0"
                style={{ width: col.width }}
              >
                {col.label}
                {col.required && <span className="text-[#ef4444] ml-1">*</span>}
              </div>
            ))}
            <div className="w-10 flex-shrink-0" />
          </div>
        </div>

        <div ref={parentRef} className="h-[600px] overflow-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: 'max-content',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const rowIndex = virtualRow.index;
              const rowData = data[rowIndex];
              const hasError = errorRows.has(rowIndex + 1);

              return (
                <div
                  key={virtualRow.key}
                  className={`flex border-b border-[#e2e8f0] hover:bg-[#e0f7f6] ${
                    hasError ? 'bg-[#fee2e2]' : ''
                  }`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 'max-content',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {COLUMNS.map(col => {
                    const cellErrors = getCellErrors(rowIndex + 1, col.key);
                    const isEditing = editingCell?.row === rowIndex && editingCell?.field === col.key;

                    return (
                      <div
                        key={col.key}
                        className={`px-4 py-2 border-r border-[#e2e8f0] editable-cell ${
                          cellErrors.length > 0 ? 'error' : ''
                        }`}
                        style={{ width: col.width }}
                      >
                        {isEditing ? (
                          <input
                            type={col.key === 'skuQuantity' ? 'number' : 'text'}
                            value={rowData[col.key as keyof ParsedOrder] as string || ''}
                            onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="input p-1 text-sm"
                          />
                        ) : (
                          <div
                            onClick={() => handleCellClick(rowIndex, col.key)}
                            className="text-sm text-[#0f172a]"
                          >
                            {String(rowData[col.key as keyof ParsedOrder] || '')}
                            {cellErrors.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-[#ef4444]" />
                                {cellErrors.map((e, i) => (
                                  <span key={i} className="text-xs text-[#ef4444]">
                                    {e.message}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="w-10 flex items-center justify-center border-r border-[#e2e8f0]">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="p-1 hover:bg-white rounded"
                    >
<Trash2 className="w-4 h-4 text-[#64748b]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 错误汇总 */}
      {errors.length > 0 && (
        <div className="card bg-[#fee2e2] border-[#fecaca]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-[#991b1b] mb-2">
                发现 {errors.length} 个错误
              </h3>
              <div className="max-h-40 overflow-auto text-sm text-[#991b1b] space-y-1">
                {errors.slice(0, 10).map((error, i) => (
                  <div key={i}>
                    · 第{error.row}行：{error.field} - {error.message}
                  </div>
                ))}
                {errors.length > 10 && (
                  <div className="text-[#991b1b]">
                    ... 还有 {errors.length - 10} 个错误
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// TODO：移除 mock 数据，从 API 获取
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
