'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, FileText, Settings, Trash2, Copy, Plus, Search, File } from 'lucide-react';
import { toast } from 'sonner';

interface ParsingRule {
  id: string;
  name: string;
  description?: string;
  fileType: 'excel' | 'word' | 'pdf';
  createdAt: string;
}

export default function RulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<ParsingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await fetch('/api/rules');
      const result = await response.json();
      setRules(result.data || []);
    } catch (error) {
      toast.error('加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('确定要删除这条规则吗？')) return;

    try {
      await fetch(`/api/rules/${ruleId}`, { method: 'DELETE' });
      setRules(rules.filter(r => r.id !== ruleId));
      toast.success('规则已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleDuplicate = (rule: ParsingRule) => {
    const newName = `${rule.name} (副本)`;
    router.push(`/rules/new?duplicate=${encodeURIComponent(JSON.stringify({ ...rule, name: newName }))}`);
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rule.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || rule.fileType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">解析规则管理</h1>
          <p className="text-[#64748b] mt-1">
            管理和配置文件格式解析规则，支持 AI 自动生成和手动配置
          </p>
        </div>
        <button
          onClick={() => router.push('/rules/new')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          新建规则
        </button>
      </div>

      {/* 筛选和搜索 */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
              <input
                type="text"
                placeholder="搜索规则名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input w-auto"
          >
            <option value="all">全部格式</option>
            <option value="excel">Excel</option>
            <option value="word">Word</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
      </div>

      {/* 规则列表 */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner" />
            <span className="ml-3 text-[#64748b]">加载中...</span>
          </div>
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            {searchTerm || filterType !== 'all' ? (
              <>
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>没有符合条件的规则</p>
              </>
            ) : (
              <>
                <Settings className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">暂无解析规则</p>
                <p className="text-sm mb-4">
                  创建第一条规则来开始批量下单
                </p>
                <button
                  onClick={() => router.push('/rules/new')}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  新建规则
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map(rule => (
            <div key={rule.id} className="card hover:shadow-lg transition cursor-pointer">
              <div
                className="flex items-start justify-between"
                onClick={() => router.push(`/rules/${rule.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#e0f7f6] flex items-center justify-center flex-shrink-0">
                    {rule.fileType === 'excel' ? (
                      <FileSpreadsheet className="w-6 h-6 text-[#0fc6c2]" />
                    ) : rule.fileType === 'pdf' ? (
                      <FileText className="w-6 h-6 text-[#0fc6c2]" />
                    ) : (
                      <File className="w-6 h-6 text-[#0fc6c2]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0f172a] truncate">
                      {rule.name}
                    </h3>
                    <p className="text-sm text-[#64748b] line-clamp-2 mt-1">
                      {rule.description || '暂无描述'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge badge-primary">
                        {rule.fileType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex justify-end gap-2">
                <button
                  onClick={() => handleDuplicate(rule)}
                  className="text-sm text-[#64748b] hover:text-[#0fc6c2] flex items-center gap-1 px-3 py-1.5 rounded hover:bg-[#f8fafc]"
                >
                  <Copy className="w-4 h-4" />
                  复制
                </button>
                <button
                  onClick={() => router.push(`/rules/${rule.id}`)}
                  className="text-sm text-[#64748b] hover:text-[#0fc6c2] flex items-center gap-1 px-3 py-1.5 rounded hover:bg-[#f8fafc]"
                >
                  <Settings className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-sm text-[#ef4444] hover:text-[#dc2626] flex items-center gap-1 px-3 py-1.5 rounded hover:bg-[#fee2e2]"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
