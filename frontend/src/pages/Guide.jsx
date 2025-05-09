import React from "react";

export default function Guide() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans pt-12 pb-4 animate-guide-fade-in">
      <div className="w-full max-w-2xl flex flex-col gap-8 px-2 sm:px-0">
        {/* 标题 */}
        <div className="mb-2 text-center animate-guide-title">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight mb-2">使用指南</h1>
          <p className="text-lg text-gray-500 font-medium">快速上手证书与代理配置</p>
        </div>

        {/* 基本使用流程卡片 */}
        <div className="relative flex bg-green-50/80 border-l-8 border-green-400 rounded-2xl shadow-lg px-8 py-7 items-start animate-guide-card" style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}>
          <div className="absolute -left-5 top-5 bg-green-400 rounded-full w-4 h-4 shadow-md hidden sm:block"></div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3 text-green-700 flex items-center gap-2">
              基本使用流程
            </h3>
            <ol className="list-decimal pl-7 text-base text-gray-800 space-y-1 leading-relaxed">
              <li>在<a href="/cert" class="text-blue-600 hover:text-blue-800 ml-1"><b>证书管理</b></a>页面生成 <span className="font-semibold text-green-700">CA证书</span> 和 <span className="font-semibold text-green-700">域名/IP证书</span>。</li>
              <li>下载<code className="font-semibold text-blue-700 bg-blue-100 px-1 rounded">ca.crt</code>，并在客户端系统中安装。</li>
              <li>在<a href="/nginx" class="text-blue-600 hover:text-blue-800 ml-1"><b>反向代理</b></a>页面添加代理配置，完成后可通过自定义域名访问目标服务。</li>
            </ol>
          </div>
        </div>

        {/* 各系统添加CA证书卡片 */

          <style>{`
          @keyframes guide-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes guide-title-down {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes guide-card-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-guide-fade-in { animation: guide-fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
          .animate-guide-title { animation: guide-title-down 0.8s cubic-bezier(.4,0,.2,1) both; }
          .animate-guide-card { animation: guide-card-up 0.8s cubic-bezier(.4,0,.2,1) both; transition: box-shadow 0.3s, transform 0.3s; }
          .animate-guide-card:hover {
            transform: scale(1.025);
            box-shadow: 0 12px 36px rgba(34,197,94,0.18), 0 4px 16px rgba(34,197,94,0.16);
          }
        `}</style>}
        <div className="relative flex bg-blue-50/80 border-l-8 border-blue-400 rounded-2xl shadow-lg px-8 py-7 items-start animate-guide-card" style={{ animationDelay: '0.25s', animationFillMode: 'backwards' }}>
          <div className="absolute -left-5 top-5 bg-blue-400 rounded-full w-4 h-4 shadow-md hidden sm:block"></div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3 text-blue-700 flex items-center gap-2">
              添加CA根证书
            </h3>
            <ul className="list-disc pl-7 text-base text-gray-800 space-y-1 leading-relaxed">
              <li><b>Windows：</b> 双击 <code className="font-semibold text-blue-700 bg-blue-100 px-1 rounded">ca.crt</code>，选择“受信任的根证书颁发机构”导入。</li>
              <li><b>macOS：</b> 双击 <code className="font-semibold text-blue-700 bg-blue-100 px-1 rounded">ca.crt</code>，在“钥匙串访问”中拖入“系统”钥匙串并设置为“始终信任”。</li>
              <li><b>iOS：</b> 用Safari访问本服务下载<code className="font-semibold text-blue-700 bg-blue-100 px-1 rounded">ca.crt</code>，设置-通用-描述文件安装并信任。</li>
              <li><b>Android：</b> 通过文件管理器安装 <code className="font-semibold text-blue-700 bg-blue-100 px-1 rounded">ca.crt</code>，部分系统需在“加密与凭据”中手动信任。</li>
              <li><b>Linux：</b> 将 <code className="font-semibold text-blue-700 bg-blue-100 px-1 rounded">ca.crt</code> 复制到 <code className="font-semibold text-blue-700 bg-blue-100 px-1 rounded">/usr/local/share/ca-certificates/</code>，执行 <code className="font-semibold text-blue-700 bg-blue-100 px-1 rounded">sudo update-ca-certificates</code>。</li>
            </ul>
          </div>
        </div>

        {/* hosts卡片 */}
        <div className="relative flex bg-yellow-50/80 border-l-8 border-yellow-400 rounded-2xl shadow-lg px-8 py-7 items-start animate-guide-card" style={{ animationDelay: '0.35s', animationFillMode: 'backwards' }}>
          <div className="absolute -left-5 top-5 bg-yellow-400 rounded-full w-4 h-4 shadow-md hidden sm:block"></div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3 text-yellow-700 flex items-center gap-2">
              修改 hosts 解析
            </h3>
            <ul className="list-disc pl-7 text-base text-gray-800 space-y-1 leading-relaxed">
              <li><b>Windows：</b> 编辑 <code className="font-semibold text-yellow-700 bg-yellow-100 px-1 rounded">C:\Windows\System32\drivers\etc\hosts</code><br/>
<span className="ml-2 text-sm text-yellow-800">快捷打开方法：按 <b>Win + R</b>，输入<br/><code className="font-mono bg-yellow-100 px-1 rounded">powershell.exe -Command "Start-Process -FilePath notepad.exe -Verb RunAs -ArgumentList \"$env:SystemRoot\system32\drivers\etc\hosts\""</code></span>
</li>
              <li><b>macOS / Linux：</b> 编辑 <code className="font-semibold text-yellow-700 bg-yellow-100 px-1 rounded">/etc/hosts</code></li>
              <li>添加如 <code className="font-semibold text-yellow-700 bg-yellow-100 px-1 rounded">192.168.1.100   test.example.com</code> 以将域名指向本服务。</li>
            </ul>
          </div>
        </div>

        {/* 温馨提示卡片 */}
        <div className="relative flex bg-gradient-to-r from-gray-50 to-gray-100 border-l-8 border-gray-400 rounded-2xl shadow-lg px-8 py-7 items-start animate-guide-card" style={{ animationDelay: '0.45s', animationFillMode: 'backwards' }}>
          <div className="absolute -left-5 top-5 bg-gray-400 rounded-full w-4 h-4 shadow-md hidden sm:block"></div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3 text-gray-700 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-500 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              温馨提示
            </h3>
            <div className="text-base text-gray-600 leading-relaxed">
              如遇浏览器信任或证书问题，请先确认CA已正确导入并信任。<br />
              检查代理软件是否将域名添加到“直连”，或直接关闭代理软件。
            </div>
          </div>
        </div>

        {/* 关于项目卡片 */}
        <div className="relative flex bg-purple-50/80 border-l-8 border-purple-400 rounded-2xl shadow-lg px-8 py-7 items-start animate-guide-card" style={{ animationDelay: '0.55s', animationFillMode: 'backwards' }}>
          <div className="absolute -left-5 top-5 bg-purple-400 rounded-full w-4 h-4 shadow-md hidden sm:block"></div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3 text-purple-700 flex items-center gap-2">
              <span className="inline-block bg-purple-100 rounded px-2 py-1 text-purple-700 mr-1">关于项目</span>
            </h3>
            <a href="https://github.com/Garonix/SSlinker" target="_blank" rel="noopener noreferrer" className="text-purple-700 font-semibold underline hover:text-purple-900 text-lg">
              https://github.com/Garonix/SSlinker
            </a>
            <div className="mt-3 text-base text-gray-700 leading-relaxed">
              <b>反馈与支持：</b> 欢迎在 GitHub 提交 issue、PR 或 star 项目。如有建议、需求或遇到问题，欢迎在主页留言。
            </div>
            <div className="mt-3 text-base text-gray-600 leading-relaxed">
              <b>致谢：</b> 感谢所有开源社区、贡献者和使用者的支持与反馈。让我们共同打造更好用的本地证书与代理工具！
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
