import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';

export default function Home() {
  const [proxy, setProxy] = useState(""); // 反代地址（域名或IP）
  const [origin, setOrigin] = useState(""); // 服务源地址
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [msg, setMsg] = useState("");

  // 自动下载CA证书
  const downloadCA = () => {
    const link = document.createElement('a');
    link.href = '/api/cert/download?type=cert&domain=SSLinker';;
    link.download = 'SSLinker.crt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 检查根证书是否存在（通过list接口）
  const checkCAExists = async () => {
    try {
      const res = await fetch("/api/cert/list");
      const data = await res.json();
      return (data.certs || []).some(cert => cert.domain === 'SSLinker');
    } catch {
      return false;
    }
  };

  // 一键自动化：生成CA、生成证书、创建反代
  const handleOneClick = async () => {
    setLoading(true);
    setStage("检查根CA证书");
    setMsg("");
    try {
      // 检查CA是否已存在
      const caExists = await checkCAExists();
      if (!caExists) {
        setStage("生成根CA证书");
        await fetch("/api/cert/ca", { method: "POST" });
      }
      setStage("生成域名证书");
      // 2. 生成证书（域名或IP）
      const params = new URLSearchParams();
      params.append('domain', proxy);
      // 
      await fetch(`/api/cert/domain?${params.toString()}`, { method: "POST" });
      setStage("创建反向代理");
      // 3. 创建反向代理
      await fetch("/api/nginx/config", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cert_domain: proxy, server_name: proxy, proxy_pass: origin })
      });
      setStage("全部完成，正在下载CA证书...");
      setTimeout(downloadCA, 300);
      setMsg('一键配置成功！<a href="/guide" class="text-blue-600 underline hover:text-blue-800 ml-1">使用指南</a>');
    } catch (e) {
      toast.error("操作失败，请检查输入和服务状态。", { duration: 4000 });
      setMsg("");
    }
    setStage("");
    setLoading(false);
  };

  const canSubmit = proxy.trim() && origin.trim();

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl flex flex-col items-center justify-center gap-10 py-20">
        <input
          className="w-full px-6 py-4 mb-2 rounded-3xl border-4 border-blue-200 bg-white text-base text-gray-500 font-sans shadow focus:outline-none focus:border-blue-400 transition font-normal placeholder-gray-300 tracking-wide"
          placeholder="请输入域名或IP（反代地址）"
          value={proxy}
          onChange={e => setProxy(e.target.value)}
          disabled={loading}
        />
        <input
          className="w-full px-6 py-4 mb-4 rounded-3xl border-4 border-green-200 bg-white text-base text-gray-500 font-sans shadow focus:outline-none focus:border-green-400 transition font-normal placeholder-gray-300 tracking-wide"
          placeholder="请输入服务源地址（如 http://10.1.2.3:8080）"
          value={origin}
          onChange={e => setOrigin(e.target.value)}
          disabled={loading}
        />
        <button
          className={`w-44 h-44 flex items-center justify-center rounded-full text-xl font-bold shadow-2xl bg-gradient-to-br from-blue-500 via-green-500 to-green-600 text-white border-4 border-blue-200 hover:from-blue-700 hover:via-green-700 hover:to-green-800 hover:shadow-2xl hover:scale-105 transition-all duration-200 ${loading || !canSubmit ? 'opacity-60 cursor-not-allowed' : ''}`}
          style={{ fontSize: '1.5rem', letterSpacing: '0.08em' }}
          disabled={loading || !canSubmit}
          onClick={handleOneClick}
        >
          {loading ? stage || '处理中...' : '一键配置'}
        </button>
        {msg && <div className="text-lg font-bold mt-4 text-center text-green-600" dangerouslySetInnerHTML={{__html: msg}} />}

      </div>
    </main>
  );
}
