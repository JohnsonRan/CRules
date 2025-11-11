'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast, { Toaster } from 'react-hot-toast';

interface UrlItem {
  originalUrl: string;
  localPath: string;
  fileUrl: string;
  resourcePath: string;
  type: 'icon' | 'rules';
  source: string;
  name: string;
  fileName: string;
}

function getFullUrl(resourcePath: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/${resourcePath}`;
  }
  return resourcePath;
}

export default function Home() {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [configFiles, setConfigFiles] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'icon' | 'rules'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const copyToClipboard = async (resourcePath: string) => {
    const fullUrl = getFullUrl(resourcePath);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(resourcePath);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const openPreview = async (file: string) => {
    setPreviewFile(file);
    try {
      const response = await fetch(`/resources/config/${file}`);
      const content = await response.text();
      setPreviewContent(content);
    } catch (err) {
      console.error('加载失败:', err);
      setPreviewContent('加载失败，请稍后重试');
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewContent('');
  };

  useEffect(() => {
    setMounted(true);
    fetch('/resources/manifest.json')
      .then(res => res.json())
      .then(data => {
        setUrls(data);
        
        // 从数据中提取唯一的配置文件来源
        const sources = Array.from(new Set(data.map((item: UrlItem) => item.source))) as string[];
        const yamlFiles = sources.filter(s => s.endsWith('.yaml') || s.endsWith('.yml'));
        setConfigFiles(yamlFiles);
      })
      .catch(err => console.error('加载失败:', err));
  }, []);

  const filteredUrls = urls.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.resourcePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const iconUrls = urls.filter(u => u.type === 'icon');
  const ruleUrls = urls.filter(u => u.type === 'rules');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      {/* 配置下载模态框 */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={() => setShowConfigModal(false)}>
          <div className="bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-100">配置文件下载</h2>
                <p className="text-sm text-slate-400 mt-1">选择需要的配置文件</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 内容 */}
            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
              {/* 配置文件列表 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Mihomo 配置文件</h3>
                {configFiles.map((file) => (
                  <div key={file} className="bg-slate-900/50 rounded-lg p-3 md:p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div>
                        <h4 className="font-medium text-slate-100 mb-1 text-sm md:text-base">{file}</h4>
                        <code className="text-[10px] md:text-xs text-slate-400 break-all block">
                          {mounted ? `${window.location.origin}/resources/config/${file}` : ''}
                        </code>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setShowConfigModal(false);
                            openPreview(file);
                          }}
                          className="px-2 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded text-xs md:text-sm transition-colors"
                        >
                          预览
                        </button>
                        <button
                          onClick={() => {
                            if (mounted) {
                              const url = `${window.location.origin}/resources/config/${file}`;
                              navigator.clipboard.writeText(url);
                              toast.success('URL 已复制到剪贴板');
                            }
                          }}
                          className="px-2 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded text-xs md:text-sm transition-colors"
                        >
                          复制
                        </button>
                        <a
                          href={`/resources/config/${file}`}
                          download
                          className="px-2 py-2 bg-blue-700 hover:bg-blue-600 active:bg-blue-600 text-white rounded text-xs md:text-sm transition-colors text-center"
                        >
                          下载
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 合并规则文件 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">合并规则文件</h3>
                
                {/* ADs_merged */}
                <div className="bg-slate-900/50 rounded-lg p-3 md:p-4 border border-slate-700">
                  <h4 className="font-medium text-slate-100 mb-2 text-sm md:text-base">ADs_merged - 广告拦截规则</h4>
                  <p className="text-[10px] md:text-xs text-slate-400 mb-3">
                    合并来源：ADRules, oisd big, reject-list (Loyalsoldier), AWAvenue, pcdn.list, Sukka's Ruleset
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-xs text-slate-400">Mihomo (.mrs)</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              if (mounted) {
                                const url = `${window.location.origin}/resources/rules/ADs_merged.mrs`;
                                navigator.clipboard.writeText(url);
                                toast.success('URL 已复制到剪贴板');
                              }
                            }}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded text-[10px] md:text-xs transition-colors"
                          >
                            复制
                          </button>
                          <a
                            href="/resources/rules/ADs_merged.mrs"
                            download
                            className="px-2 py-1 bg-blue-700 hover:bg-blue-600 active:bg-blue-600 text-white rounded text-[10px] md:text-xs transition-colors"
                          >
                            下载
                          </a>
                        </div>
                      </div>
                      <code className="block text-[9px] md:text-xs text-slate-400 bg-slate-950/50 px-2 py-1 rounded break-all">
                        {mounted ? `${window.location.origin}/resources/rules/ADs_merged.mrs` : ''}
                      </code>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-xs text-slate-400">通用格式 (.txt)</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              if (mounted) {
                                const url = `${window.location.origin}/resources/rules/ADs_merged.txt`;
                                navigator.clipboard.writeText(url);
                                toast.success('URL 已复制到剪贴板');
                              }
                            }}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded text-[10px] md:text-xs transition-colors"
                          >
                            复制
                          </button>
                          <a
                            href="/resources/rules/ADs_merged.txt"
                            download
                            className="px-2 py-1 bg-blue-700 hover:bg-blue-600 active:bg-blue-600 text-white rounded text-[10px] md:text-xs transition-colors"
                          >
                            下载
                          </a>
                        </div>
                      </div>
                      <code className="block text-[9px] md:text-xs text-slate-400 bg-slate-950/50 px-2 py-1 rounded break-all">
                        {mounted ? `${window.location.origin}/resources/rules/ADs_merged.txt` : ''}
                      </code>
                    </div>
                  </div>
                </div>

                {/* AIs_merged */}
                <div className="bg-slate-900/50 rounded-lg p-3 md:p-4 border border-slate-700">
                  <h4 className="font-medium text-slate-100 mb-2 text-sm md:text-base">AIs_merged - AI 服务规则</h4>
                  <p className="text-[10px] md:text-xs text-slate-400 mb-3">
                    合并来源：ForestL18/rules-dat, MetaCubeX/meta-rules-dat, Sukka's Ruleset, DustinWin/ruleset_geodata
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-xs text-slate-400">Mihomo (.mrs)</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              if (mounted) {
                                const url = `${window.location.origin}/resources/rules/ai.mrs`;
                                navigator.clipboard.writeText(url);
                                toast.success('URL 已复制到剪贴板');
                              }
                            }}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded text-[10px] md:text-xs transition-colors"
                          >
                            复制
                          </button>
                          <a
                            href="/resources/rules/ai.mrs"
                            download
                            className="px-2 py-1 bg-blue-700 hover:bg-blue-600 active:bg-blue-600 text-white rounded text-[10px] md:text-xs transition-colors"
                          >
                            下载
                          </a>
                        </div>
                      </div>
                      <code className="block text-[9px] md:text-xs text-slate-400 bg-slate-950/50 px-2 py-1 rounded break-all">
                        {mounted ? `${window.location.origin}/resources/rules/ai.mrs` : ''}
                      </code>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-xs text-slate-400">通用格式 (.txt)</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              if (mounted) {
                                const url = `${window.location.origin}/resources/rules/ai.txt`;
                                navigator.clipboard.writeText(url);
                                toast.success('URL 已复制到剪贴板');
                              }
                            }}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded text-[10px] md:text-xs transition-colors"
                          >
                            复制
                          </button>
                          <a
                            href="/resources/rules/ai.txt"
                            download
                            className="px-2 py-1 bg-blue-700 hover:bg-blue-600 active:bg-blue-600 text-white rounded text-[10px] md:text-xs transition-colors"
                          >
                            下载
                          </a>
                        </div>
                      </div>
                      <code className="block text-[9px] md:text-xs text-slate-400 bg-slate-950/50 px-2 py-1 rounded break-all">
                        {mounted ? `${window.location.origin}/resources/rules/ai.txt` : ''}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* 说明文档 */}
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">使用说明</h3>
                <div className="space-y-4 text-sm text-slate-300">
                  <div>
                    <h4 className="font-medium text-slate-200 mb-2">📦 配置特点</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>所有资源已本地化，加载速度更快</li>
                      <li>图标和规则文件均已下载到本地</li>
                      <li>配置文件中的 URL 已替换为本站地址</li>
                      <li>支持预览配置文件内容</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-200 mb-2">🚀 快速开始</h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                      <li>点击"预览"查看配置文件内容</li>
                      <li>点击"复制"获取配置文件 URL</li>
                      <li>点击"下载"保存配置文件到本地</li>
                      <li>在 Mihomo 客户端中导入配置</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-200 mb-2">📝 文件格式说明</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li><strong className="text-slate-300">.mrs</strong> - Mihomo 专用格式，体积更小，加载更快</li>
                      <li><strong className="text-slate-300">.txt</strong> - 通用格式，兼容 Surge、Clash 等客户端</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            

          </div>
        </div>
      )}

      {/* 配置文件预览模态框 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={closePreview}>
          <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-100">{previewFile}</h2>
                <p className="text-sm text-slate-400 mt-1">配置文件预览</p>
              </div>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 内容 */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language="yaml"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                  showLineNumbers
                >
                  {previewContent}
                </SyntaxHighlighter>
              </div>
            </div>
            
            {/* 底部操作栏 */}
            <div className="flex items-center justify-between p-4 md:p-6 border-t border-slate-700 gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewContent);
                  toast.success('配置内容已复制到剪贴板');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
              >
                复制内容
              </button>
              <a
                href={`/resources/config/${previewFile}`}
                download
                className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-center"
              >
                下载文件
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 复制成功提示 */}
      {copiedUrl && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 bg-green-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg z-50 animate-fade-in max-w-[90vw]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm md:text-base">已复制</span>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-slate-100 mb-1 md:mb-2">
                {process.env.NEXT_PUBLIC_SITE_NAME || "NextJS"}
              </h1>
              <p className="text-sm md:text-base text-slate-300">
                {process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "WoW!"}
              </p>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-blue-700 hover:bg-blue-600 active:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm md:text-base">下载配置</span>
            </button>
          </div>
        </header>

        <div className="bg-slate-800 rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="bg-blue-950/30 rounded-lg p-3 md:p-4 border border-blue-900/50">
              <div className="text-xl md:text-3xl font-bold text-blue-400">{urls.length}</div>
              <div className="text-xs md:text-sm text-blue-300">总资源</div>
            </div>
            <div className="bg-purple-950/30 rounded-lg p-3 md:p-4 border border-purple-900/50">
              <div className="text-xl md:text-3xl font-bold text-purple-400">{iconUrls.length}</div>
              <div className="text-xs md:text-sm text-purple-300">图标</div>
            </div>
            <div className="bg-green-950/30 rounded-lg p-3 md:p-4 border border-green-900/50">
              <div className="text-xl md:text-3xl font-bold text-green-400">{ruleUrls.length}</div>
              <div className="text-xs md:text-sm text-green-300">规则</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:gap-4">
            <input
              type="text"
              placeholder="搜索资源..."
              className="w-full px-3 py-2 md:px-4 text-sm md:text-base bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 md:px-4 text-sm md:text-base rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-700 text-slate-200 active:bg-slate-600'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('icon')}
                className={`px-3 py-2 md:px-4 text-sm md:text-base rounded-lg font-medium transition-colors ${
                  filter === 'icon'
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-700 text-slate-200 active:bg-slate-600'
                }`}
              >
                图标
              </button>
              <button
                onClick={() => setFilter('rules')}
                className={`px-3 py-2 md:px-4 text-sm md:text-base rounded-lg font-medium transition-colors ${
                  filter === 'rules'
                    ? 'bg-green-700 text-white'
                    : 'bg-slate-700 text-slate-200 active:bg-slate-600'
                }`}
              >
                规则
              </button>
            </div>
          </div>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {filteredUrls.map((item, index) => (
            <button
              key={index}
              onClick={() => copyToClipboard(item.resourcePath)}
              className={`relative bg-slate-800 rounded-lg shadow-md active:shadow-lg md:hover:shadow-xl transition-all duration-200 p-3 md:p-4 flex flex-col items-center gap-2 md:gap-3 group ${
                copiedUrl === item.resourcePath ? 'ring-2 ring-green-500' : 'active:scale-95 md:hover:scale-105'
              }`}
            >
              {/* 类型标签 */}
              <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2">
                <span
                  className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${
                    item.type === 'icon'
                      ? 'bg-purple-950/50 text-purple-300 border border-purple-900/50'
                      : 'bg-green-950/50 text-green-300 border border-green-900/50'
                  }`}
                >
                  {item.type === 'icon' ? '图标' : '规则'}
                </span>
              </div>

              {/* 复制成功标记 */}
              {copiedUrl === item.resourcePath && (
                <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* 图标/文件预览 */}
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                {item.type === 'icon' ? (
                  <img 
                    src={`/${item.resourcePath}`} 
                    alt={item.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3E?%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-slate-900/50 rounded-lg group-active:bg-slate-900 md:group-hover:bg-slate-900 transition-colors">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 文件名 */}
              <div className="text-center w-full">
                <div className="text-xs md:text-sm font-medium text-slate-100 truncate" title={item.fileName}>
                  {item.fileName}
                </div>
                <div className="text-[10px] md:text-xs text-slate-400 truncate mt-0.5 md:mt-1" title={item.name}>
                  {item.name}
                </div>
              </div>

              {/* 复制图标 - 仅桌面显示 */}
              <div className="hidden md:block absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {filteredUrls.length === 0 && (
          <div className="text-center py-8 md:py-12 text-slate-400 bg-slate-800 rounded-lg shadow-md">
            <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base md:text-lg">没有找到匹配的资源</p>
          </div>
        )}
      </div>
    </div>
  );
}
