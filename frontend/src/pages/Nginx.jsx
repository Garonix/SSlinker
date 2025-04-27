import React, { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';

const TOAST_DURATION = 3000;

export default function Nginx() {
  const [configs, setConfigs] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [form, setForm] = useState({ cert_domain: '', server_name: '', proxy_pass: '' });
  const [creating, setCreating] = useState(false);
  const [reloadLoading, setReloadLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [certList, setCertList] = useState([]);
  const [certLoading, setCertLoading] = useState(false);

  // 获取证书列表（仅域名证书，不含CA）
  const fetchCertList = async () => {
    setCertLoading(true);
    try {
      const res = await fetch('/api/cert/list');
      const data = await res.json();
      // 只保留非CA证书
      setCertList((data.certs || []).filter(c => c.domain !== 'SSLinker'));
    } catch {
      setCertList([]);
    }
    setCertLoading(false);
  };

  const fetchConfigs = async () => {
    setListLoading(true);
    try {
      const res = await fetch('/api/nginx/list');
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch {
      setConfigs([]);
    }
    setListLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
    fetchCertList();
  }, []);

  const handleInput = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCreate = async () => {
    if (!form.cert_domain || !form.server_name || !form.proxy_pass) {
      toast.error('证书、服务标识和代理目标不能为空', { duration: TOAST_DURATION });
      return;
    }
    // 前端校验和自动补全协议
    let proxyPass = form.proxy_pass.trim();
    if (!/^\w+:\/\//.test(proxyPass)) {
      proxyPass = 'http://' + proxyPass;
    }
    if (!/^\w+:\/\//.test(proxyPass)) {
      toast.error('代理目标必须以 http://、https:// 等协议头开头', { duration: TOAST_DURATION });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/nginx/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, proxy_pass: proxyPass })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已生成反向代理配置', { duration: TOAST_DURATION });
        setForm({ cert_domain: '', server_name: '', proxy_pass: '' });
        setShowForm(false);
        fetchConfigs();
      } else {
        toast.error(data.message || '生成失败', { duration: TOAST_DURATION });
      }
    } catch {
      toast.error('请求失败', { duration: TOAST_DURATION });
    }
    setCreating(false);
  };

  const handleDelete = async (domain) => {
    if (!window.confirm(`确定要删除配置 ${domain} 吗？`)) return;
    try {
      const res = await fetch(`/api/nginx/config?domain=${encodeURIComponent(domain)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功', { duration: TOAST_DURATION });
        fetchConfigs();
      } else {
        toast.error(data.message || '删除失败', { duration: TOAST_DURATION });
      }
    } catch {
      toast.error('请求失败', { duration: TOAST_DURATION });
    }
  };

  const handleReload = async () => {
    setReloadLoading(true);
    try {
      const res = await fetch('/api/nginx/reload', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || '服务已重载', { duration: TOAST_DURATION });
      } else {
        toast.error(data.message || '重载失败', { duration: TOAST_DURATION });
      }
    } catch {
      toast.error('请求失败', { duration: TOAST_DURATION });
    }
    setReloadLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white pt-10 pb-2">
      <Toaster position="top-center" />
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-6 py-2 mt-2">
        <div className="w-full max-w-2xl mb-2">
          {/* 卡片风格 */}
          <div className="bg-green-50 rounded-xl shadow px-6 py-5 flex flex-col items-center mb-2">
            <div className="flex items-center mb-6">
              <span className="text-2xl font-bold text-green-700 mr-3 tracking-wide">反向代理</span>
            </div>
            <div className="flex gap-6">
              <button
                className="px-10 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 font-bold text-xl transition shadow-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                onClick={() => setShowForm(true)}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                  </svg>
                  添加配置
                </span>
              </button>
              <button
                className="px-10 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-bold text-xl transition shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                onClick={handleReload}
                disabled={reloadLoading}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16m16-8H4"></path>
                  </svg>
                  {reloadLoading ? '重载中...' : '服务重载'}
                </span>
              </button>
            </div>
          </div>
          {showForm && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20">
              <div className="bg-green-50 rounded-2xl p-8 shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-green-700 mb-0">nginx配置生成</h3>
                  <button className="text-gray-400 hover:text-gray-700 text-xl font-bold" onClick={() => setShowForm(false)}>&times;</button>
                </div>
                <div className="w-full">
                  <div className="mb-3 text-left">
                    <label className="block text-green-600 mb-1">选择证书<span className="text-red-500">*</span></label>
                    <select
                      name="cert_domain"
                      value={form.cert_domain}
                      onChange={handleInput}
                      className="w-full border px-3 py-2 rounded text-lg bg-white"
                      disabled={certLoading || certList.length === 0}
                    >
                      <option value="">请选择证书</option>
                      {certList.map(cert => (
                        <option key={cert.domain} value={cert.domain}>{cert.domain}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3 text-left">
                    <label className="block text-green-600 mb-1">服务标识（server_name）<span className="text-red-500">*</span></label>
                    <input
                      name="server_name"
                      value={form.server_name}
                      onChange={handleInput}
                      className="w-full border px-3 py-2 rounded text-lg"
                      placeholder="如 example.com、*.gezixa.com 或 192.168.1.1"
                    />
                  </div>
                  <div className="mb-3 text-left">
                    <label className="block text-green-600 mb-1">代理目标（proxy_pass）<span className="text-red-500">*</span></label>
                    <input
                      name="proxy_pass"
                      value={form.proxy_pass}
                      onChange={handleInput}
                      className="w-full border px-3 py-2 rounded text-lg"
                      placeholder="如 http://127.0.0.1:8080"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300"
                      onClick={() => setShowForm(false)}
                      disabled={creating}
                    >取消</button>
                    <button
                      className="px-6 py-1 rounded bg-green-600 text-white hover:bg-green-700 font-bold text-lg"
                      onClick={handleCreate}
                      disabled={creating || certList.length === 0}
                    >{creating ? '生成中...' : '确定'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 卡片间距加大 */}
      <div className="h-8" />
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-6 py-8 mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-base rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-green-50 to-green-100 text-green-700">
                <th className="py-4 px-4 font-bold text-lg text-left tracking-wide">服务标识</th>
                <th className="py-4 px-4 font-bold text-lg text-left tracking-wide">代理目标</th>
                <th className="py-4 px-4 font-bold text-lg text-center tracking-wide">操作</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={3} className="text-gray-400 text-center py-6">加载中...</td>
                </tr>
              ) : configs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-gray-400 text-center py-10 text-lg">暂无配置</td>
                </tr>
              ) : configs.map(cfg => (
                <tr key={cfg.domain} className="border-b last:border-none hover:bg-green-50 transition-all group">
                  <td
                    className="py-4 px-4 text-left font-mono text-green-900 text-lg cursor-pointer"
                    onClick={() => window.open(`http://${cfg.domain}`, '_blank')}
                    // title="点击访问"
                    style={{ textDecoration: 'none' }}
                  >
                    {cfg.domain}
                  </td>
                  <td className="py-4 px-4 text-left font-mono text-blue-900 text-lg">{cfg.proxy_pass}</td>
                  <td className="py-4 px-4 text-center">
                    <button
                      className="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-700 shadow-sm transition-all text-base font-bold"
                      onClick={() => handleDelete(cfg.domain)}
                    >删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}