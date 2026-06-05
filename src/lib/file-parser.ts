/**
 * 文件解析工具函数
 * 
 * 支持 Excel, Word, PDF 文件读取
 */
import * as XLSX from 'xlsx';

/**
 * Excel 文件解析结果
 */
export interface ExcelFileData {
  sheets: string[];
  data: Record<string, any[][]>;
  rawData: ArrayBuffer;
}

/**
 * 解析 Excel 文件
 */
export async function parseExcelFile(file: File | ArrayBuffer): Promise<ExcelFileData> {
  let buffer: ArrayBuffer;
  
  if (file instanceof ArrayBuffer) {
    buffer = file;
  } else if (file instanceof Blob) {
    buffer = await file.arrayBuffer();
  } else {
    throw new Error('Invalid file type');
  }

  const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true });
  
  const sheets = workbook.SheetNames;
  const data: Record<string, any[][]> = {};

  for (const sheetName of sheets) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    data[sheetName] = jsonData as any[][];
  }

  return {
    sheets,
    data,
    rawData: buffer,
  };
}

/**
 * 获取 Excel 文件的预览（前 N 行）
 */
export function getExcelPreview(
  excelData: ExcelFileData,
  maxRows: number = 20,
  maxCols: number = 20
): string {
  const firstSheet = excelData.sheets[0];
  const sheetData = excelData.data[firstSheet] || [];
  
  const preview = sheetData
    .slice(0, maxRows)
    .map(row => row.slice(0, maxCols).join(' | '))
    .join('\n');

  return `Sheet: ${firstSheet}\n${preview}`;
}

/**
 * PDF 文件解析结果
 */
export interface PDFFieldData {
  text: string;
  pages: number;
  rawText: string;
}

/**
 * 解析 PDF 文件
 */
export async function parsePDFField(file: File | ArrayBuffer): Promise<PDFFieldData> {
  // TODO: 实际 PDF 解析需要解决 ESM 导入问题
  // 临时返回占位数据
  return {
    text: 'PDF 解析功能开发中...',
    pages: 1,
    rawText: '',
  };
}

/**
 * Word 文件解析结果
 */
export interface WordFieldData {
  text: string;
  value: string;
}

/**
 * 解析 Word 文件（.docx）
 */
export async function parseWordField(file: File | ArrayBuffer): Promise<WordFieldData> {
  // TODO: Word 解析功能开发中
  return {
    text: 'Word 解析功能开发中...',
    value: '',
  };
}

/**
 * 统一文件解析接口
 */
export async function parseFile(
  file: File
): Promise<{
  fileType: 'excel' | 'word' | 'pdf';
  data: ExcelFileData | PDFFieldData | WordFieldData;
  preview: string;
}> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const excelData = await parseExcelFile(file);
    return {
      fileType: 'excel',
      data: excelData,
      preview: getExcelPreview(excelData),
    };
  } else if (fileName.endsWith('.pdf')) {
    const pdfData = await parsePDFField(file);
    return {
      fileType: 'pdf',
      data: pdfData,
      preview: pdfData.text.slice(0, 2000),
    };
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    const wordData = await parseWordField(file);
    return {
      fileType: 'word',
      data: wordData,
      preview: wordData.text.slice(0, 2000),
    };
  } else {
    throw new Error(`不支持的文件格式：${file.name}`);
  }
}

/**
 * 文件验证
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.xlsx', '.xls', '.pdf', '.docx', '.doc'];
  
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: '不支持的文件格式，请上传 Excel(.xlsx/.xls)、Word(.docx/.doc) 或 PDF(.pdf) 文件',
    };
  }
  
  // 检查文件大小（最大 20MB）
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '文件大小超过限制（最大 20MB）',
    };
  }
  
  return { valid: true };
}
