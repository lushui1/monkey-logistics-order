'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, FileText, File as FileIcon, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.match(/\.(xlsx|xls|docx|doc|pdf)$/)) {
      handleFileSelect(droppedFile);
    } else {
      toast.error('请上传 Excel/Word/PDF 文件');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '上传失败');
      toast.success('上传成功，正在分析文件结构...');
      router.push(`/rules/new?fileId=${data.fileId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">智能批量下单系统</h1>
                <p className="text-xs text-gray-500">AI 驱动 · 多格式解析 · 一键导入</p>
              </div>
            </div>
            <nav className="flex gap-4">
              <a href="/waybills" className="text-sm text-gray-600 hover:text-cyan-600">已导入运单</a>
              <a href="/rules" className="text-sm text-gray-600 hover:text-cyan-600">解析规则</a>
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* 欢迎区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            上传出库单，AI 自动解析
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            支持 Excel / Word / PDF 任意格式，AI 智能识别字段结构
          </p>
        </div>

        {/* 上传区域 */}
        <div 
          className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-cyan-200 p-12 text-center hover:border-cyan-400 transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.docx,.doc,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          
          <div className="w-20 h-20 rounded-full bg-cyan-50 mx-auto mb-6 flex items-center justify-center">
            <Upload className="w-10 h-10 text-cyan-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {file ? file.name : '点击或拖拽上传文件'}
          </h3>
          <p className="text-gray-500 mb-6">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : '支持 .xlsx .xls .docx .doc .pdf 格式'}
          </p>

          {file && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 rounded-lg">
                {file.name.endsWith('xlsx') || file.name.endsWith('xls') ? (
                  <FileSpreadsheet className="w-5 h-5 text-cyan-600" />
                ) : file.name.endsWith('pdf') ? (
                  <FileIcon className="w-5 h-5 text-red-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
                <span className="text-sm text-cyan-700">{file.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="p-1 hover:bg-red-50 rounded"
              >
                <CheckCircle className="w-5 h-5 text-green-600" />
              </button>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始解析
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* 特性说明 */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-cyan-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">AI 智能解析</h4>
            <p className="text-gray-600 text-sm">
              大模型自动分析文件结构，识别表头、数据行和字段映射关系
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">多格式支持</h4>
            <p className="text-gray-600 text-sm">
              Excel/Word/PDF 全支持，无论表格还是纯文本都能准确提取
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">智能校验</h4>
            <p className="text-gray-600 text-sm">
              必填字段、格式、重复项实时检测，确保数据准确无误
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
