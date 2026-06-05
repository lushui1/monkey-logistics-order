'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, FileText, File, X, Loader2, AlertCircle, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { parseFile, validateFile } from '@/lib/file-parser';
import type { ParsingRule } from '@/types/rule-engine';

export default function HomePage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [selectedRule, setSelectedRule] = useState<ParsingRule | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setFile(selectedFile);
    setUploading(true);

    try {
      const result = await parseFile(selectedFile);
      setPreview(result.preview);
      toast.success('文件上传成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '文件解析失败');
      setFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleRemoveFile = () => {
    setFile(null);
    setPreview('');
    setSelectedRule(null);
    setParsedData([]);
    setUploadProgress(0);
  };

  const handleParseWithAI = async () => {
    if (!file) return;

    setParsing(true);
    try {
      // 调用 API 进行 AI 解析
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', 'ai-generate');

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('AI 解析失败');
      }

      const result = await response.json();
      setParsedData(result.data);
      
      // 跳转到预览页面
      router.push(`/preview?fileId=${encodeURIComponent(file.name)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '解析失败');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = () => {
    if (parsedData.length > 0) {
      router.push(`/preview?fileId=${encodeURIComponent(file!.name)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 文件上传区 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">上传出库单文件</h2>
        </div>

        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-[#0fc6c2] bg-[#e0f7f6]'
                : 'border-[#e2e8f0] hover:border-[#0fc6c2] hover:bg-[#f8fafc]'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#e0f7f6] flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#0fc6c2]" />
              </div>
              <div>
                <p className="text-lg font-medium text-[#0f172a] mb-1">
                  {isDragActive ? '松开以上传文件' : '拖拽文件到此处，或点击上传'}
                </p>
                <p className="text-sm text-[#64748b]">
                  支持 Excel (.xlsx/.xls)、Word (.docx/.doc)、PDF (.pdf) 格式
                </p>
                <p className="text-xs text-[#64748b] mt-2">
                  最大文件大小：20MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#f8fafc] rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#0fc6c2] flex items-center justify-center flex-shrink-0">
                  {file.name.endsWith('pdf') ? (
                    <FileText className="w-6 h-6 text-white" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#0f172a] truncate">{file.name}</h3>
                  <p className="text-sm text-[#64748b] mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploading && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-[#64748b]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>文件解析中...</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 hover:bg-white rounded-lg transition"
                disabled={uploading}
              >
                <X className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>

            {/* 预览 */}
            {preview && (
              <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                <p className="text-sm font-medium text-[#0f172a] mb-2">文件预览</p>
                <pre className="bg-white rounded-lg p-4 text-xs text-[#64748b] overflow-auto max-h-64 whitespace-pre-wrap">
                  {preview}
                </pre>
              </div>
            )}

            {/* 规则选择 */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleParseWithAI}
                disabled={uploading || parsing}
                className="btn-primary"
              >
                <Sparkles className="w-4 h-4" />
                {parsing ? 'AI 分析中...' : 'AI 智能生成规则'}
              </button>

              <button
                onClick={() => router.push('/rules/new?file=' + encodeURIComponent(file.name))}
                disabled={uploading}
                className="btn-secondary"
              >
                <Upload className="w-4 h-4" />
                手动创建规则
              </button>

              <select
                value={selectedRule?.id || ''}
                onChange={(e) => {
                  const rule = savedRules.find(r => r.id === e.target.value);
                  setSelectedRule(rule || null);
                }}
                className="input w-auto"
                disabled={uploading}
              >
                <option value="">选择已有规则</option>
                {savedRules.map(rule => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 进度条 */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-[#64748b] mt-1 text-center">
                  解析进度：{uploadProgress}% （已处理 {parsedData.length} 条）
                </p>
              </div>
            )}

            {/* 提交按钮 */}
            {parsedData.length > 0 && (
              <div className="mt-6 flex items-center justify-between bg-[#d1fae5] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#10b981]" />
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">
                      解析成功，共 {parsedData.length} 条记录
                    </p>
                    <p className="text-xs text-[#059669]">
                      请检查数据后提交
                    </p>
                  </div>
                </div>
                <button onClick={handleSubmit} className="btn-primary">
                  检查并提交
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="w-12 h-12 rounded-lg bg-[#e0f7f6] flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-6 h-6 text-[#0fc6c2]" />
          </div>
          <h3 className="font-semibold text-[#0f172a] mb-2">多格式支持</h3>
          <p className="text-sm text-[#64748b]">
            支持 Excel、Word、PDF 等多种格式，无需手动转换
          </p>
        </div>

        <div className="card">
          <div className="w-12 h-12 rounded-lg bg-[#e0f7f6] flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-[#0fc6c2]" />
          </div>
          <h3 className="font-semibold text-[#0f172a] mb-2">AI 智能解析</h3>
          <p className="text-sm text-[#64748b]">
            大模型自动分析文件结构，生成解析规则，零配置使用
          </p>
        </div>

        <div className="card">
          <div className="w-12 h-12 rounded-lg bg-[#e0f7f6] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-[#0fc6c2]" />
          </div>
          <h3 className="font-semibold text-[#0f172a] mb-2">智能错误检测</h3>
          <p className="text-sm text-[#64748b]">
            实时校验必填字段、格式、重复项，所有错误一目了然
          </p>
        </div>
      </div>
    </div>
  );
}

// TODO: 从数据库加载规则
const savedRules: ParsingRule[] = [];
