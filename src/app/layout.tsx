import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '智能批量下单系统 | 物流出库',
  description: '基于 AI 大模型的智能多格式批量下单系统，支持 Excel/Word/PDF 任意格式解析',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-[#f8fafc]">
          {/* 顶部导航栏 */}
          <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0fc6c2] flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#0f172a]">智能批量下单系统</h1>
                    <p className="text-xs text-[#64748b]">AI 驱动的物流出库管理平台</p>
                  </div>
                </div>
                
                <nav className="flex items-center gap-6">
                  <a
                    href="/"
                    className="text-sm font-medium text-[#64748b] hover:text-[#0fc6c2] transition"
                  >
                    文件导入
                  </a>
                  <a
                    href="/rules"
                    className="text-sm font-medium text-[#64748b] hover:text-[#0fc6c2] transition"
                  >
                    解析规则
                  </a>
                  <a
                    href="/waybills"
                    className="text-sm font-medium text-[#64748b] hover:text-[#0fc6c2] transition"
                  >
                    已导入运单
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* 主内容区 */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
