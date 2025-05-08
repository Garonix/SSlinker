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
  const [selectedRows, setSelectedRows] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, domains: [] });
  const [showLocalAddrModal, setShowLocalAddrModal] = useState(false);
  const [localAddr, setLocalAddr] = useState("");
  const [nginxStatus, setNginxStatus] = useState('unknown');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetch('/api/nginx/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'running') setNginxStatus('running');
        else if (data.status === 'stopped') setNginxStatus('stopped');
        else setNginxStatus('error');
      })
      .catch(() => setNginxStatus('error'));
  }, []);

  // 获取证书列表 (仅域名证书，不含CA )
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
      if ('local_addr' in data) setLocalAddr(data.local_addr || '');
    } catch (e) {
      setConfigs([]);
    }
    setListLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
    fetchCertList();
    fetchNginxStatus();
    fetchLocalAddr();
  }, []);

  // 获取本机IP
  const fetchLocalAddr = async () => {
    try {
      const res = await fetch('/api/nginx/local_addr');
      const data = await res.json();
      setLocalAddr(data.local_addr || '');
    } catch {
      setLocalAddr('');
    }
  }

  // 获取nginx服务状态
  const fetchNginxStatus = async () => {
    try {
      const res = await fetch('/api/nginx/status');
      const data = await res.json();
      if (data.status === 'running') setNginxStatus('running');
      else if (data.status === 'stopped') setNginxStatus('stopped');
      else setNginxStatus('error');
    } catch {
      setNginxStatus('error');
    }
  }

  const handleInput = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCreate = async () => {
    // 普通证书自动赋值 server_name
    let finalServerName = form.server_name;
    if (selectedCertType === 'normal') {
      finalServerName = form.cert_domain;
    }
    if (!form.cert_domain || !finalServerName || !form.proxy_pass) {
      toast.error('证书、反代地址和源地址不能为空', { duration: TOAST_DURATION });
      return;
    }
    // 前端校验和自动补全协议
    let proxyPass = form.proxy_pass.trim();
    if (!/^\w+:\/\//.test(proxyPass)) {
      proxyPass = 'http://' + proxyPass;
    }
    if (!/^\w+:\/\//.test(proxyPass)) {
      toast.error('源地址必须以 http://、https:// 等协议头开头', { duration: TOAST_DURATION });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/nginx/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, server_name: finalServerName, proxy_pass: proxyPass })
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
    setConfirmModal({ open: true, domains: [domain] });
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return;
    setConfirmModal({ open: true, domains: [...selectedRows] });
  };

  const doDelete = async () => {
    const domains = confirmModal.domains;
    setConfirmModal({ open: false, domains: [] });
    let successCount = 0;
    let failCount = 0;
    let failMessages = [];
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      try {
        const res = await fetch(`/api/nginx/config?domain=${encodeURIComponent(domain)}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          successCount += 1;
        } else {
          failCount += 1;
          failMessages.push(data.message || `删除${domain}失败`);
        }
      } catch {
        failCount += 1;
        failMessages.push(`请求${domain}失败`);
      }
    }
    fetchConfigs();
    setSelectedRows([]);
    setTimeout(() => {
      if (failCount === 0) {
        toast.success('删除成功', { duration: TOAST_DURATION });
      } else {
        toast.error(failMessages.join('；'), { duration: TOAST_DURATION });
      }
    }, 100);
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

  // 判断证书类型
  function getCertType(cert) {
    if (cert.domain && cert.domain.startsWith('*.')) return 'wildcard';
    if (cert.type === '其他证书' || cert.uploaded) return 'other';
    return 'normal';
  }

  // 证书下拉选项，包含普通、泛域名、其他证书
  const certOptions = certList.map(cert => ({
    value: cert.domain,
    label: cert.domain,
    type: getCertType(cert),
  }));

  // 当前选中证书类型
  const selectedCert = certList.find(c => c.domain === form.cert_domain);
  const selectedCertType = selectedCert ? getCertType(selectedCert) : null;

  // 是否显示反代地址输入框
  const showServerNameInput = selectedCertType === 'wildcard' || selectedCertType === 'other';

  // 编辑逻辑
  function handleEdit(cfg) {
    setForm({
      cert_domain: cfg.cert_domain || cfg.domain || '',
      server_name: cfg.server_name || cfg.domain || '',
      proxy_pass: cfg.proxy_pass || ''
    });
    setShowForm(true);
  }

  // 勾选逻辑
  const handleSelectRow = (domain) => {
    setSelectedRows(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };
  const handleSelectAll = () => {
    if (selectedRows.length === configs.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(configs.map(cfg => cfg.domain));
    }
  };

  // 操作按钮单独卡片
  const handleRefresh = () => fetchConfigs();
  const handleEditSelected = () => {
    if (selectedRows.length === 1) {
      const cfg = configs.find(cfg => cfg.domain === selectedRows[0]);
      if (cfg) handleEdit(cfg);
    }
  };

  // 复制hosts格式
  const handleCopyHosts = () => {
    if (!window.isSecureContext) {
      toast.error('当前页面非安全上下文，无法复制到剪贴板', { duration: TOAST_DURATION });
      return;
    }
    if (!localAddr || selectedRows.length === 0) {
      toast.error('请先设置本机IP并选择配置', { duration: TOAST_DURATION });
      return;
    }
    const lines = selectedRows.map(sel => {
      const cfg = configs.find(c => c.domain === sel);
      if (!cfg) return null;
      return `${localAddr} ${cfg.domain}`;
    }).filter(Boolean);
    if (lines.length === 0) {
      toast.error('未找到选中配置', { duration: TOAST_DURATION });
      return;
    }
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('已复制到剪贴板', { duration: TOAST_DURATION });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white pt-10 pb-2">
      <Toaster position="top-center" />
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg px-6 py-2 mt-2">
        <div className="w-full max-w-5xl mb-2">
          {/* 卡片风格 */}
          <div className="bg-green-50 rounded-xl shadow px-6 py-5 flex flex-col items-center mb-2 animate-nginx-card">
            <div className="flex items-center mb-6">
              <span className="text-2xl font-bold text-green-700 mr-3 tracking-wide" style={{ position: 'relative', left: '20px' }}>反向代理</span>
              {/* nginx状态小圆圈 仅圆圈，右侧，自定义浮窗 */}
              <span className="relative ml-3 inline-block" style={{ left: '10px', top: '2px' }}>
                <span
                  className={`w-4 h-4 rounded-full border border-gray-300 shadow ${nginxStatus === 'running' ? 'bg-green-500 animate-pulse' : nginxStatus === 'stopped' ? 'bg-gray-400 animate-pulse' : nginxStatus === 'error' ? 'bg-red-500 animate-pulse' : 'bg-gray-200 animate-pulse'}`}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  style={{ display: 'inline-block', cursor: 'pointer', animationDuration: '1.5s' }}
                ></span>
                {showTooltip && (
                  <div className={`absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 px-4 py-2 rounded-xl shadow-lg text-sm font-semibold whitespace-nowrap ${nginxStatus === 'running' ? 'bg-green-50 text-green-700 border border-green-200' : nginxStatus === 'stopped' ? 'bg-gray-50 text-gray-600 border border-gray-200' : nginxStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                    style={{ minWidth: '90px' }}>
                    {nginxStatus === 'running' ? 'nginx服务正常' : nginxStatus === 'stopped' ? 'nginx服务停止' : nginxStatus === 'error' ? 'nginx服务异常' : 'nginx状态未知'}
                  </div>
                )}
              </span>
            </div>
            <div className="flex gap-6">

              <button
                className="px-10 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-bold text-xl transition shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                onClick={handleReload}
                disabled={reloadLoading}
              >
                <span className="flex items-center gap-2">
                  <span className="text-2xl font-bold align-middle" style={{ position: 'relative', top: '-2px' }}>⟳</span>
                  {reloadLoading ? '重载中...' : '服务重载'}
                </span>
              </button>
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
                className="px-10 py-3 bg-gradient-to-r from-blue-500 to-sky-400 text-white rounded-full hover:from-blue-600 hover:to-sky-500 font-bold text-xl transition shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
                onClick={() => setShowLocalAddrModal(true)}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinejoin="round" d="M12 4L4 20L20 20Z"></path>
                  </svg>
                  本机IP
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 列表和操作卡片并排 */}
      <div className="w-full max-w-5xl flex flex-row gap-8 mt-8">
        {/* 列表 */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-8 animate-nginx-card">
            <div className="overflow-x-auto">
              <table className="w-full text-base rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-green-100 text-green-700 text-lg">
                    <th className="py-3 px-2 text-center w-12">
                      <span className="inline-flex items-center justify-center">
                        <input type="checkbox"
                          id="cb-all"
                          checked={selectedRows.length === configs.length && configs.length > 0}
                          onChange={handleSelectAll}
                          className="peer appearance-none h-5 w-5 border-2 border-green-500 rounded bg-white align-middle cursor-pointer transition"
                        />
                        <svg className="absolute pointer-events-none w-4 h-4 text-green-500" style={{ display: selectedRows.length === configs.length && configs.length > 0 ? 'block' : 'none' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4 8-8" />
                        </svg>
                      </span>
                    </th>
                    <th className="py-3 px-4 text-left">反代地址</th>
                    <th className="py-3 px-4 text-left">源地址</th>
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
                    <tr key={cfg.domain} className="border-b last:border-none hover:bg-green-50 transition-all group animate-nginx-row" style={{animationDelay: `${0.07 + (0.04 * configs.indexOf(cfg))}s`, animationFillMode: 'backwards'}}>
                      <td className="py-4 px-2 text-center">
                        <span className="inline-flex items-center justify-center">
                          <input
                            type="checkbox"
                            id={`row-cb-${cfg.domain}`}
                            checked={selectedRows.includes(cfg.domain)}
                            onChange={() => handleSelectRow(cfg.domain)}
                            className="peer appearance-none h-5 w-5 border-2 border-green-500 rounded bg-white align-middle cursor-pointer transition"
                          />
                          <svg className="absolute pointer-events-none w-4 h-4 text-green-500" style={{ display: selectedRows.includes(cfg.domain) ? 'block' : 'none' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4 8-8" />
                          </svg>
                        </span>
                      </td>
                      <td
                        className="py-4 px-4 text-left font-mono text-green-900 text-lg cursor-pointer"
                        onClick={() => window.open(`http://${cfg.domain}`, '_blank')}
                        style={{ textDecoration: 'none' }}
                      >
                        {cfg.domain}
                      </td>
                      <td className="py-4 px-4 text-left font-mono text-blue-900 text-lg">{cfg.proxy_pass}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 操作按钮卡片 */}
        <div className="w-40 flex-shrink-0">
          <div
            className="bg-white rounded-2xl shadow-lg px-2 py-4 flex flex-col items-center justify-start animate-nginx-card"
            style={{ position: 'sticky', top: 280, zIndex: 20, height: 240 }}
          >
            <button
              className="w-32 mb-4 px-3 py-2 rounded-full font-bold text-base shadow transition-all bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleRefresh}
            >刷新</button>
            <button
              className={`w-32 mb-4 px-3 py-2 rounded-full font-bold text-base shadow transition-all ${selectedRows.length === 1 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
              disabled={selectedRows.length !== 1}
              onClick={handleEditSelected}
            >编辑</button>
            <button
              className={`w-32 mb-4 px-3 py-2 rounded-full font-bold text-base shadow transition-all ${selectedRows.length > 0 ? 'bg-red-500 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
              disabled={selectedRows.length === 0}
              onClick={handleDeleteSelected}
            >删除</button>
            <button
              className={`w-32 mb-4 px-3 py-2 rounded-full font-bold text-base shadow transition-all ${selectedRows.length > 0 ? 'bg-blue-300 text-white hover:bg-blue-400' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
              disabled={selectedRows.length === 0}
              onClick={handleCopyHosts}
            >复制hosts</button>
          </div>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20 animate-nginx-fade-in">
          <div className="bg-green-50 rounded-2xl p-8 shadow-xl border border-green-200 animate-nginx-modal" style={{ minWidth: 0 }}>
            <div className="flex flex-col items-center">
              <h3 className="text-2xl font-bold text-green-700 mb-6 tracking-wide flex items-center w-[320px]">
                <span className="mr-2">配置生成</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-lg border border-green-200 font-semibold">自定义</span>
                <button className="ml-auto text-gray-400 hover:text-gray-700 text-2xl font-bold px-2" onClick={() => setShowForm(false)}>&times;</button>
              </h3>
              <form className="flex flex-col w-[320px]" onSubmit={e => { e.preventDefault(); handleCreate(); }}>
                <div className="mb-5 text-left">
                  <label className="block text-gray-700 font-semibold mb-2">选择证书 <span className="text-gray-400 text-sm"></span></label>
                  <select
                    name="cert_domain"
                    value={form.cert_domain}
                    onChange={handleInput}
                    className="w-full px-3 py-2 rounded-lg border-2 border-green-200 focus:outline-none focus:border-green-400 bg-white text-base text-green-700 transition"
                    disabled={certLoading || certList.length === 0}
                  >
                    <option value="">请选择证书</option>
                    {certOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {showServerNameInput && (
                  <div className="mb-5 text-left">
                    <label className="block text-gray-700 font-semibold mb-2">反代地址 <span className="text-gray-400 text-sm"></span></label>
                    <input
                      name="server_name"
                      value={form.server_name}
                      onChange={handleInput}
                      className="w-full px-3 py-2 rounded-lg border-2 border-green-200 focus:outline-none focus:border-green-400 bg-white text-base text-green-700 transition"
                      placeholder="如 example.com、192.168.1.1"
                    />
                  </div>
                )}
                <div className="mb-5 text-left">
                  <label className="block text-gray-700 font-semibold mb-2">源地址 <span className="text-gray-400 text-sm"></span></label>
                  <input
                    name="proxy_pass"
                    value={form.proxy_pass}
                    onChange={handleInput}
                    onBlur={e => {
                      const val = e.target.value.trim();
                      if (val) {
                        const protocolSeparatorIndex = val.indexOf('://'); // 查找 '://'

                        if (protocolSeparatorIndex !== -1) { // 如果包含 '://'
                          // 如果不以标准的 http:// 或 https:// 开头
                          if (!/^https?:\/\//i.test(val)) {
                            const restOfString = val.substring(protocolSeparatorIndex + 3);
                            const correctedVal = 'http://' + restOfString; // 改为 http://

                            handleInput({
                              target: { name: 'proxy_pass', value: correctedVal }
                            });
                          }
                          // 如果是标准的 http:// 或 https://，则不做修改
                        } else { // 如果不包含 '://'
                          const correctedVal = 'http://' + val; // 直接加上 http://

                          handleInput({
                            target: { name: 'proxy_pass', value: correctedVal }
                          });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border-2 border-green-200 focus:outline-none focus:border-green-400 bg-white text-base text-green-700 transition"
                    placeholder="如 http://127.0.0.1:8080"
                  />
                </div>
                <div className="flex justify-end gap-4 mt-8 w-full">
                  <button type="button" className="px-5 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 font-semibold transition text-lg" onClick={() => setShowForm(false)} disabled={creating}>取消</button>
                  <button
                    type="submit"
                    className={
                      "px-7 py-2 rounded-full bg-green-600 text-white font-bold text-lg shadow-md " +
                      (creating || !form.cert_domain || !form.proxy_pass || (showServerNameInput && !form.server_name)
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-green-700")
                    }
                    disabled={creating || !form.cert_domain || !form.proxy_pass || (showServerNameInput && !form.server_name)}
                  >{creating ? '生成中...' : '确定'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* 本机IP弹窗 */}
      {showLocalAddrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-blue-50 rounded-2xl shadow-2xl p-8 w-full max-w-xs border border-blue-200 animate-nginx-modal">
            <div className="font-bold text-lg mb-4 text-blue-700">设置本机IP</div>
            <div className="mb-6 text-blue-700 text-base">仅限IP地址</div>
            <input
              className="w-full px-4 py-2 mb-6 rounded-lg border-2 border-blue-300 bg-white text-base text-blue-700 focus:outline-none focus:border-blue-500 transition"
              placeholder="本机IP"
              value={localAddr}
              onChange={e => setLocalAddr(e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowLocalAddrModal(false)} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200">取消</button>
              <button
                onClick={async () => {
                  // IP地址校验（支持IPv4/IPv6）
                  const ipv4 = /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.|$)){4}$/;
                  const ipv6 = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;
                  if (!localAddr.trim() || (!ipv4.test(localAddr.trim()) && !ipv6.test(localAddr.trim()))) {
                    toast.error('请输入有效的IP地址', { duration: TOAST_DURATION });
                    return;
                  }
                  try {
                    const res = await fetch('/api/nginx/local_addr', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ local_addr: localAddr })
                    });
                    const data = await res.json();
                    setLocalAddr(data.local_addr || localAddr);
                    toast.success('本机IP已设置', { duration: TOAST_DURATION });
                  } catch {
                    toast.error('本机IP保存失败', { duration: TOAST_DURATION });
                  }
                  setShowLocalAddrModal(false);
                }}
                className={`px-5 py-2 bg-blue-500 text-white rounded-full font-bold ${localAddr.trim() ? 'hover:bg-blue-600' : 'opacity-60 cursor-not-allowed'}`}
                disabled={!localAddr.trim()}
              >确定</button>
            </div>
          </div>
        </div>
      )}
      {/* 现代化确认弹窗 */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs border border-green-200 animate-nginx-modal">
            <div className="font-bold text-lg mb-4 text-gray-800">删除配置</div>
            <div className="mb-6 text-gray-700 text-base">
              {confirmModal.domains.length === 1
                ? `确定要删除配置“${confirmModal.domains[0]}”吗？`
                : `确定要删除选中的 ${confirmModal.domains.length} 个配置吗？`}
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => setConfirmModal({ open: false, domains: [] })} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200">取消</button>
              <button onClick={doDelete} className="px-5 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700">确定</button>
            </div>
          </div>
        </div>
      )}
      {/* 动画样式 */}
      <style>{`
        @keyframes nginx-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes nginx-modal-in {
          from { opacity: 0; transform: scale(0.97) translateY(32px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes nginx-card-up {
          from { opacity: 0; transform: translateY(36px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nginx-row-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-nginx-fade-in { animation: nginx-fade-in 0.5s cubic-bezier(.4,0,.2,1) both; }
        .animate-nginx-modal { animation: nginx-modal-in 0.7s cubic-bezier(.4,0,.2,1) both; }
        .animate-nginx-card { animation: nginx-card-up 0.7s cubic-bezier(.4,0,.2,1) both; transition: box-shadow 0.3s, transform 0.3s; }
        .animate-nginx-row { animation: nginx-row-up 0.5s cubic-bezier(.4,0,.2,1) both; }
        .animate-nginx-card:hover {
          transform: scale(1.025);
          box-shadow: 0 12px 36px rgba(34,197,94,0.13), 0 4px 16px rgba(34,197,94,0.10);
        }
        .animate-nginx-row:hover {
          background: #f0fdf4 !important;
          transform: scale(1.01);
        }
      `}</style>
    </div>
  );
}