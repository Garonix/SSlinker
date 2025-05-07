import React from "react";

export default function Guide() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white pt-10 pb-2">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        {/* 基本使用流程卡片 */}
        <div className="bg-green-50 border border-green-100 rounded-xl shadow px-6 py-5">
          <h3 className="text-lg font-semibold mb-2 text-green-700">一、基本使用流程</h3>
          <ol className="list-decimal pl-6 text-base text-gray-800">
            <li>在“证书管理”页面生成CA证书和域名/IP证书。</li>
            <li>下载CA证书，并在客户端系统中安装。</li>
            <li>在“反向代理”页面添加代理配置，完成后可通过自定义域名访问目标服务。</li>
          </ol>
        </div>
        {/* 各系统添加CA证书卡片 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl shadow px-6 py-5">
          <h3 className="text-lg font-semibold mb-2 text-blue-700">二、各系统添加CA证书方法</h3>
          <ul className="list-disc pl-6 text-base text-gray-800">
            <li><b>Windows：</b> 双击<code>ca.crt</code>，选择“受信任的根证书颁发机构”导入。</li>
            <li><b>macOS：</b> 双击<code>ca.crt</code>，在“钥匙串访问”中拖入“系统”钥匙串并设置为“始终信任”。</li>
            <li><b>iOS：</b> 用Safari访问本服务下载CA，设置-通用-描述文件安装并信任。</li>
            <li><b>Android：</b> 通过文件管理器安装<code>ca.crt</code>，部分系统需在“加密与凭据”中手动信任。</li>
            <li><b>Linux：</b> 将<code>ca.crt</code>复制到<code>/usr/local/share/ca-certificates/</code>，执行<code>sudo update-ca-certificates</code>。</li>
          </ul>
        </div>
        {/* hosts卡片 */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl shadow px-6 py-5">
          <h3 className="text-lg font-semibold mb-2 text-yellow-700">三、如何修改 hosts 解析</h3>
          <ul className="list-disc pl-6 text-base text-gray-800">
            <li><b>Windows：</b> 编辑 <code>C:\Windows\System32\drivers\etc\hosts</code></li>
            <li><b>macOS / Linux：</b> 编辑 <code>/etc/hosts</code></li>
            <li>添加如 <code>192.168.1.100   test.example.com</code> 以将域名指向本服务。</li>
          </ul>
        </div>
        {/* 温馨提示卡片 */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl shadow px-6 py-5">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">温馨提示</h3>
          <div className="text-base text-gray-600">
            如遇浏览器信任或证书问题，请先确认CA已正确导入并信任。
          </div>
        </div>
      </div>
    </div>
  );
}
