import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import HostsModal from '../components/HostsModal';

export default function Home() {
  const [showHostsModal, setShowHostsModal] = useState(false);
  const [hostsLines, setHostsLines] = useState([]);
  const [proxy, setProxy] = useState(""); // 反代地址 (域名或IP )
  const [origin, setOrigin] = useState(""); // 服务源地址
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [msg, setMsg] = useState("");
  // 修复hooks顺序问题，将hover状态放到组件顶层
  const [hover, setHover] = useState(false);

  // 自动下载CA证书
  const downloadCA = () => {
    const link = document.createElement('a');
    link.href = '/api/cert/download?type=cert&domain=SSLinker';;
    link.download = 'SSLinker.crt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 检查根证书是否存在 (通过list接口 )
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
    setStage("检查\nCA证书");
    setMsg("");
    try {
      // 检查CA是否已存在
      const caExists = await checkCAExists();
      if (!caExists) {
        setStage("生成\nCA证书");
        await fetch("/api/cert/ca", { method: "POST" });
      }
      setStage("生成\n域名证书");
      // 2. 生成证书 (域名或IP )
      const params = new URLSearchParams();
      params.append('domain', proxy);
      // 
      await fetch(`/api/cert/domain?${params.toString()}`, { method: "POST" });
      setStage("创建\n反向代理");
      // 3. 创建反向代理
      await fetch("/api/nginx/config", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cert_domain: proxy, server_name: proxy, proxy_pass: origin })
      });
      setStage("success");
      setTimeout(downloadCA, 300);
      setMsg('success');
      // 记录 hosts 内容，供后续弹窗用
      setHostsLines([`${origin.replace(/^https?:\/\//, '')} ${proxy}`]);
    } catch (e) {
      toast.error("操作失败\n请检查输入和服务状态。", { duration: 4000 });
      setMsg("");
      setStage("");
      setLoading(false);
    }
  };


  const canSubmit = proxy.trim() && origin.trim();

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 animate-fade-in">
      <div className="w-full max-w-xl flex flex-col items-center justify-center gap-10 py-16 px-2 sm:px-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>

        {/* 输入卡片 */}
        <div className="w-full bg-white/90 rounded-3xl shadow-2xl px-8 py-10 flex flex-col gap-7 items-center animate-fade-in-up" style={{ animationDelay: '0.18s', animationFillMode: 'backwards' }}>
          <input
            className="w-full px-6 py-4 rounded-2xl border-4 border-blue-400 bg-white text-base text-gray-700 font-sans shadow focus:outline-none focus:border-blue-500 transition-all duration-200 font-normal placeholder-gray-300 tracking-wide focus:scale-[1.03] hover:shadow-lg"
            placeholder="请输入域名或IP (反代地址 )"
            value={proxy}
            onChange={e => setProxy(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <input
            className="w-full px-6 py-4 rounded-2xl border-4 border-green-400 bg-white text-base text-gray-700 font-sans shadow focus:outline-none focus:border-green-500 transition-all duration-200 font-normal placeholder-gray-300 tracking-wide focus:scale-[1.03] hover:shadow-lg"
            placeholder="请输入服务源地址 (代理目标 )"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            onBlur={e => {
              const val = e.target.value.trim();
              if (val) {
                const protocolSeparatorIndex = val.indexOf('://'); // 查找 '://'          
                if (protocolSeparatorIndex !== -1) { // 如果包含 '://'
                  // 如果不以标准的 http:// 或 https:// 开头
                  if (!/^https?:\/\//i.test(val)) {
                    const restOfString = val.substring(protocolSeparatorIndex + 3);
                    const correctedVal = 'http://' + restOfString; // 改为 http://
                    setOrigin(correctedVal);
                  }
                  // 如果是标准的 http:// 或 https://，则不做修改
                } else { // 如果不包含 '://'
                  setOrigin('http://' + val);
                }
              }
            }}
            disabled={loading}
          />
          <HostsModal
        open={showHostsModal}
        onClose={() => setShowHostsModal(false)}
        hostsLines={hostsLines}
      />
      {stage === 'success' ? (
            <button
              className={`w-44 h-44 flex items-center justify-center rounded-full text-3xl font-extrabold focus:outline-none transition-all duration-300 shadow-xl
                ${hover
                  ? 'bg-gradient-to-br via-cyan-400 from-blue-500 to-teal-400 scale-110'
                  : 'bg-gradient-to-br from-green-400 via-cyan-400 to-teal-400 scale-100'
                }`}
              style={{
                letterSpacing: '0.08em',
                WebkitFontSmoothing: 'antialiased',
                boxShadow: '0 8px 32px 0 rgba(34,197,94,0.18), 0 2px 8px 0 rgba(0,0,0,0.10), inset 0 1px 8px 1px rgba(255,255,255,0.18)'
              }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => setShowHostsModal(true)}
            >
              <span className="flex flex-col items-center gap-2 animate-fade-in">
                {hover ? (
                  <svg className="w-14 h-14 text-white mb-2 drop-shadow-xl" fill="none" viewBox="0 0 24 24">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="w-14 h-14 text-white mb-2 drop-shadow-xl" fill="none" viewBox="0 0 24 24">
                    <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className="text-white font-extrabold text-3xl tracking-wide select-none" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{hover ? 'hosts' : '成功'}</span>
              </span>
            </button>
          ) : (
            <button
              className={`w-44 h-44 flex items-center justify-center rounded-full text-2xl font-extrabold shadow-2xl bg-gradient-to-br from-blue-600 via-green-500 to-green-600 text-white border-4 border-gray-200 focus:outline-none hover:from-blue-800 hover:via-green-600 hover:to-green-800 hover:shadow-[0_8px_32px_rgba(34,197,94,0.25)] hover:scale-110 active:scale-95 transition-all duration-300 animate-glow ${loading || !canSubmit ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{ fontSize: '1.7rem', letterSpacing: '0.08em', boxShadow: '0 8px 32px rgba(34,197,94,0.15)' }}
              disabled={loading || !canSubmit}
              onClick={handleOneClick}
            >
              {loading ? (
                <span className="flex flex-col items-center gap-2 animate-pulse">
                  <span className="text-2xl" style={{whiteSpace:'pre-line'}}>{stage || '处理中...'}</span>
                </span>
              ) : (
                <span className="animate-fade-in">一键配置</span>
              )}
            </button>
          )}

        </div>
      </div>
      {/* 动画样式 */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(32px);} to { opacity: 1; transform: none; } }
        @keyframes glow { 0% { box-shadow: 0 0 32px 0 rgba(59,130,246,0.18), 0 8px 32px rgba(34,197,94,0.10);} 50% { box-shadow: 0 0 64px 8px rgba(59,130,246,0.22), 0 8px 32px rgba(34,197,94,0.20);} 100% { box-shadow: 0 0 32px 0 rgba(59,130,246,0.18), 0 8px 32px rgba(34,197,94,0.10);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </main>
  );
}
