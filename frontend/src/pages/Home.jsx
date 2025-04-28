import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';

export default function Home() {
  const [proxy, setProxy] = useState(""); // 反代地址（域名或IP）
  const [origin, setOrigin] = useState(""); // 服务源地址
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [msg, setMsg] = useState("");
  const [nginxStatus, setNginxStatus] = useState('unknown'); // 状态: running | stopped | error | unknown

  // 获取nginx服务状态
  React.useEffect(() => {
    fetch('/api/nginx/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'running') setNginxStatus('running');
        else if (data.status === 'stopped') setNginxStatus('stopped');
        else setNginxStatus('error');
      })
      .catch(() => setNginxStatus('error'));
  }, []);

  // 自动下载CA证书
  const downloadCA = () => {
    const link = document.createElement('a');
    link.href = '/api/cert/download?type=ca';
    link.download = 'ca.crt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 一键自动化：生成CA、生成证书、创建反代
  const handleOneClick = async () => {
    setLoading(true);
    setStage("正在生成根CA证书...");
    setMsg("");
    try {
      // 1. 生成根CA（幂等）
      await fetch("/api/cert/ca", { method: "POST" });
      setStage("正在为反代地址生成证书...");
      // 2. 生成证书（域名或IP）
      const params = new URLSearchParams();
      params.append('domain', proxy);
      await fetch(`/api/cert/domain?${params.toString()}`, { method: "POST" });
      setStage("正在创建反向代理...");
      // 3. 创建反向代理
      await fetch("/api/nginx/create", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cert_domain: proxy, server_name: proxy, proxy_pass: origin })
      });
      setStage("全部完成，正在下载CA证书...");
      setTimeout(downloadCA, 300);
      setMsg("一键配置成功！请前往反向代理页面管理。");
    } catch (e) {
      toast.error("操作失败，请检查输入和服务状态。", { duration: 4000 });
      setMsg("");
    }
    setStage("");
    setLoading(false);
  };

  const canSubmit = proxy.trim() && origin.trim();

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-xl flex flex-col items-center justify-center gap-10 py-20">
        <input
          className="w-full px-6 py-5 mb-2 rounded-3xl border-2 border-blue-200 bg-white text-xl text-blue-700 font-mono shadow focus:outline-none focus:border-blue-400 transition"
          placeholder="请输入域名或IP（反代地址）"
          value={proxy}
          onChange={e => setProxy(e.target.value)}
          disabled={loading}
        />
        <input
          className="w-full px-6 py-5 mb-4 rounded-3xl border-2 border-green-200 bg-white text-xl text-green-700 font-mono shadow focus:outline-none focus:border-green-400 transition"
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
        {msg && <div className="text-lg font-bold mt-4 text-center text-green-600">{msg}</div>}
      </div>
      {/* Nginx服务状态小圆圈 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 select-none">
        <span
          className={`inline-block w-4 h-4 rounded-full border border-gray-300 shadow ${nginxStatus === 'running' ? 'bg-green-500' : nginxStatus === 'stopped' ? 'bg-gray-400' : nginxStatus === 'error' ? 'bg-red-500 animate-pulse' : 'bg-gray-200'}`}
          title={nginxStatus === 'running' ? 'nginx服务正常' : nginxStatus === 'stopped' ? 'nginx服务停止' : nginxStatus === 'error' ? 'nginx服务异常' : '未知'}
        ></span>
        <span className="text-sm text-gray-500">
          {nginxStatus === 'running' ? 'nginx服务正常' : nginxStatus === 'stopped' ? 'nginx服务停止' : nginxStatus === 'error' ? 'nginx服务异常' : 'nginx状态未知'}
        </span>
      </div>
    </main>
  );
}
