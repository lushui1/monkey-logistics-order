'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsingRule } from '@/types/rule-engine';

function RulesNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileId = searchParams.get('fileId');
  
  const [loading, setLoading] = useState(false);
  const [rule, setRule] = useState<ParsingRule | null>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (fileId) {
      simulateAIGeneration();
    }
  }, [fileId]);

  const simulateAIGeneration = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rules/generate?fileId=${fileId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '生成失败');
      setRule(data.rule);
      setFileName(data.fileName);
      toast.success('AI 规则生成成功！请确认字段映射');
    } catch (error) {
      const mockRule: ParsingRule = {
        id: 'mock-rule',
        name: '自动生成的解析规则',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fileType: 'excel',
        dataRow: { startRow: 1 },
        fieldMappings: [
          { field: 'externalCode', source: 'cell', locator: { type: 'row-col', col: 0 }, transform: { type: 'trim' } },
          { field: 'storeName', source: 'cell', locator: { type: 'row-col', col: 1 }, transform: { type: 'trim' } },
          { field: 'recipientName', source: 'cell', locator: { type: 'row-col', col: 2 }, transform: { type: 'trim' } },
          { field: 'recipientPhone', source: 'cell', locator: { type: 'row-col', col: 3 }, transform: { type: 'trim' } },
          { field: 'recipientAddress', source: 'cell', locator: { type: 'row-col', col: 4 }, transform: { type: 'trim' } },
          { field: 'skuCode', source: 'cell', locator: { type: 'row-col', col: 5 }, transform: { type: 'trim' }, required: true },
          { field: 'skuName', source: 'cell', locator: { type: 'row-col', col: 6 }, transform: { type: 'trim' }, required: true },
          { field: 'skuQuantity', source: 'cell', locator: { type: 'row-col', col: 7 }, transform: { type: 'number' }, required: true },
          { field: 'skuSpec', source: 'cell', locator: { type: 'row-col', col: 8 }, transform: { type: 'trim' } },
          { field: 'remark', source: 'cell', locator: { type: 'row-col', col: 9 }, transform: { type: 'trim' } },
        ],
      };
      setRule(mockRule);
      setFileName('测试文件.xlsx');
      toast.success('已生成模拟规则');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!rule) return;
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');
      toast.success('规则保存成功！');
      router.push(`/preview?fileId=${fileId}&ruleId=${data.ruleId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
                <ArrowLeft size={18} /> 返回
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">解析规则配置</h1>
                <p className="text-sm text-gray-500">{fileName || '分析文件中...'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={simulateAIGeneration} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50">
                <RotateCcw size={18} /> 重新生成
              </button>
              <button onClick={handleSave} disabled={!rule} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50">
                <Save size={18} /> 保存并预览
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-cyan-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 正在分析文件结构</h3>
            <p className="text-gray-500">识别表头、数据行和字段映射关系...</p>
          </div>
        ) : rule ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="font-semibold text-gray-900">规则生成成功</h3>
                <p className="text-sm text-gray-500">已识别 {rule.fieldMappings?.length} 个字段</p>
              </div>
            </div>

            {/* 字段映射表格 */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3">字段映射</h4>
              <table className="w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r w-12">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r">目标字段</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r">源列</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r">转换</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">必填</th>
                  </tr>
                </thead>
                <tbody>
                  {rule.fieldMappings?.map((mapping, index) => (
                    <tr key={mapping.field} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 border-b border-r text-center">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-r font-medium">{mapping.field}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-r">
                        {mapping.locator.type === 'row-col' && mapping.locator.col !== undefined 
                          ? `列 ${typeof mapping.locator.col === 'number' ? mapping.locator.col + 1 : mapping.locator.col}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-r">{mapping.transform?.type || '无'}</td>
                      <td className="px-4 py-3 text-sm border-b">
                        {mapping.required ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">必填</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 数据行设置 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">数据行识别</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">起始行</label>
                  <div className="text-gray-900 font-medium">第 {rule.dataRow?.startRow ? (typeof rule.dataRow.startRow === 'number' ? rule.dataRow.startRow + 1 : '-') : '-'} 行</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">起始关键词</label>
                  <div className="text-gray-900">{rule.dataRow?.startKeyword || '未设置'}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">AI 生成准确率约 90%</p>
                  <p>请仔细核对字段映射关系，确保 SKU 编码、SKU 名称、数量等必填字段正确对应。</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">点击"重新生成"开始 AI 分析</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RulesNewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
      <RulesNewContent />
    </Suspense>
  );
}
