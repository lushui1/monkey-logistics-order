'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Package, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface Waybill {
  id: string;
  externalCode?: string | null;
  storeName?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  skuCode: string;
  skuName: string;
  skuQuantity: number;
  status: string;
  createdAt: string;
}

export default function WaybillsPage() {
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'externalCode' | 'recipientName'>('externalCode');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadWaybills();
  }, [page, pageSize]);

  const loadWaybills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        [searchType]: searchTerm,
      });
      
      const response = await fetch(`/api/waybills?${params}`);
      const result = await response.json();
      
      setWaybills(result.data || []);
      setTotal(result.pagination?.total || 0);
    } catch (error) {
      toast.error('加载运单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadWaybills();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* 顶部标题 */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">已导入运单</h1>
        <p className="text-[#64748b]">
          查看和管理历史导入的运单记录
        </p>
      </div>

      {/* 筛选和搜索 */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
              <input
                type="text"
                placeholder={searchType === 'externalCode' ? '搜索外部编码...' : '搜索收件人姓名...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            className="input w-auto"
          >
            <option value="externalCode">外部编码</option>
            <option value="recipientName">收件人姓名</option>
          </select>
          <button onClick={handleSearch} className="btn-primary">
            <Search className="w-4 h-4" />
            搜索
          </button>
        </div>
      </div>

      {/* 运单列表 */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner" />
            <span className="ml-3 text-[#64748b]">加载中...</span>
          </div>
        </div>
      ) : waybills.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">暂无运单记录</p>
            <p className="text-sm text-[#64748b]">
              上传出库单文件并导入后，运单会显示在这里
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 统计信息 */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#64748b]">
              共 <span className="font-semibold text-[#0f172a]">{total}</span> 条运单
            </p>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="input w-auto text-sm"
            >
              <option value={10}>每页 10 条</option>
              <option value={20}>每页 20 条</option>
              <option value={50}>每页 50 条</option>
            </select>
          </div>

          {/* 表格 */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>外部编码</th>
                    <th>收货信息</th>
                    <th>SKU 编码</th>
                    <th>SKU 名称</th>
                    <th>数量</th>
                    <th>状态</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {waybills.map(waybill => (
                    <tr key={waybill.id}>
                      <td className="font-mono text-sm">
                        {waybill.externalCode || '-'}
                      </td>
                      <td>
                        <div className="text-sm">
                          {waybill.storeName && (
                            <div className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {waybill.storeName}
                            </div>
                          )}
                          {waybill.recipientName && (
                            <div className="flex items-center gap-1 text-[#64748b]">
                              <User className="w-3 h-3" />
                              {waybill.recipientName}
                              {waybill.recipientPhone && ` (${waybill.recipientPhone})`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-sm">
                        {waybill.skuCode}
                      </td>
                      <td>{waybill.skuName}</td>
                      <td className="font-semibold">
                        {waybill.skuQuantity}
                      </td>
                      <td>
                        <span className={`badge ${
                          waybill.status === 'submitted' ? 'badge-success' :
                          waybill.status === 'failed' ? 'badge-error' :
                          'badge-warning'
                        }`}>
                          {waybill.status === 'submitted' ? '已提交' :
                           waybill.status === 'failed' ? '失败' :
                           '待提交'}
                        </span>
                      </td>
                      <td className="text-sm text-[#64748b]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(waybill.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#e2e8f0] px-6 py-4">
                <p className="text-sm text-[#64748b]">
                  第 {page} 页，共 {totalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
