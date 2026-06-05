'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

function NewRuleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<'excel' | 'word' | 'pdf'>('excel');
  const [ruleConfig, setRuleConfig] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const duplicateData = searchParams.get('duplicate');
    if (duplicateData) {
      try {
        const rule = JSON.parse(decodeURIComponent(duplicateData));
        setName(rule.name);
        setDescription(rule.description || '');
        setFileType(rule.fileType);
        setRuleConfig(JSON.stringify((rule as any).ruleConfig || {}, null, 2));
      } catch {
        toast.error('加载规则失败');
      }
    }
    const fileName = searchParams.get('file');
    if (fileName) {
      setName(`${fileName.split('.')[0]} 解析规则`);
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!name || !ruleConfig) {
      toast.error('请填写规则名称和配置');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, fileType, ruleConfig: JSON.parse(ruleConfig) }),
      });
      if (!response.ok) throw new Error('保存失败');
      toast.success('规则已保存');
      router.push('/rules');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateWithAI = async () => {
    toast.info('AI 辅助生成规则功能开发中');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">新建解析规则</h1>
            <p className="text-[#64748b]">手动配置或使用 AI 生成文件解析规则</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存规则'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold text-[#0f172a] mb-4">基础信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">规则名称 *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="例如：湖南仓发货单解析规则" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">文件类型 *</label>
                <select value={fileType} onChange={(e) => setFileType(e.target.value as any)} className="input">
                  <option value="excel">Excel (.xlsx/.xls)</option>
                  <option value="word">Word (.docx/.doc)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1">描述</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={3} placeholder="简要描述此规则的适用场景" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#0f172a]">规则配置</h2>
              <button onClick={handleGenerateWithAI} className="btn-secondary">
                <Sparkles className="w-4 h-4" /> AI 辅助生成
              </button>
            </div>
            <textarea value={ruleConfig} onChange={(e) => setRuleConfig(e.target.value)} className="input font-mono text-sm" rows={20} placeholder={`{\n  "dataRow": { "startRow": 1 },\n  "fieldMappings": [{ "field": "skuCode", "locator": { "type": "row-col", "col": 0 } }]\n}`} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-[#0f172a] mb-3">快速入门</h3>
            <div className="space-y-3 text-sm text-[#64748b]">
              <div className="flex items-start gap-2"><div className="w-6 h-6 rounded bg-[#e0f7f6] flex items-center justify-center text-[#0fc6c2] font-semibold text-xs">1</div><p>上传文件到首页，选择"AI 辅助生成"可自动创建规则</p></div>
              <div className="flex items-start gap-2"><div className="w-6 h-6 rounded bg-[#e0f7f6] flex items-center justify-center text-[#0fc6c2] font-semibold text-xs">2</div><p>手动配置需要指定：文件类型、数据行识别规则、字段映射关系</p></div>
              <div className="flex items-start gap-2"><div className="w-6 h-6 rounded bg-[#e0f7f6] flex items-center justify-center text-[#0fc6c2] font-semibold text-xs">3</div><p>复杂格式（矩阵、卡片式等）可配置特殊的解析规则</p></div>
            </div>
          </div>
          <div className="card bg-[#e0f7f6] border-[#a7f3ef]">
            <h3 className="font-bold text-[#0f172a] mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#0fc6c2]" /> AI 辅助生成</h3>
            <p className="text-sm text-[#64748b]">推荐使用 AI 自动生成规则。上传文件后，大模型会自动分析文件结构并生成配置。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewRulePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="loading-spinner" /></div>}>
      <NewRuleContent />
    </Suspense>
  );
}
