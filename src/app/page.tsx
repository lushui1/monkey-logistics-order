'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.match(/\.(xlsx|xls)$/)) {
      handleFileSelect(droppedFile);
    } else {
      toast.error('请上传 Excel 文件 (.xlsx/.xls)');
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
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
      
      setFileId(data.fileId);
      toast.success('上传成功！');
      
      // 直接跳转到预览页面
      router.push(`/preview?fileId=${data.fileId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">智能批量下单系统</h1>
              <p className="text-xs text-gray-500">AI 驱动 · 多格式解析 · 一键导入</p>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* 欢迎区域 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">上传出库单文件</h2>
          <p className="text-gray-600">支持 Excel 格式，AI 自动解析订单数据</p>
        </div>

        {/* 上传区域 */}
        <div 
          className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-cyan-200 p-16 text-center hover:border-cyan-400 transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          
          <div className="w-20 h-20 rounded-full bg-cyan-50 mx-auto mb-6 flex items-center justify-center">
            <Upload className="w-10 h-10 text-cyan-500" />
          </div>
          
          {file ? (
            <div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileSpreadsheet className="w-6 h-6 text-cyan-600" />
                <span className="text-lg font-medium text-gray-900">{file.name}</span>
              </div>
              <p className="text-gray-500 mb-6">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                disabled={uploading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 disabled:opacity-50 mx-auto"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    开始解析
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">点击或拖拽上传文件</h3>
              <p className="text-gray-500 mb-6">支持 .xlsx .xls 格式</p>
              <button className="px-8 py-3 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600">
                选择文件
              </button>
            </div>
          )}
        </div>

        {/* 功能说明 */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-cyan-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">一键上传</h4>
            <p className="text-gray-600 text-sm">支持 Excel 文件拖拽上传，自动解析订单数据</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2智能预览</h4>
            <p className="text-gray-600 text-sm">实时预览解析结果，支持编辑和校验</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">批量下单</h4>
            <p className="text-gray-600 text-sm">一键提交所有订单，自动创建运单</p>
          </div>
        </div>
      </main>
    </div>
  );
}
