import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';

const TOAST_DURATION = 3000;

function isCA(cert) {
  return cert.domain === 'SSLinker';
}

function isWildcard(cert) {
  // 只要域名以*开头或包含通配符
  return (cert.domain || cert.name || '').startsWith('*.') || (cert.domain || cert.name || '').includes('.*');
}

function isUploaded(cert) {
  return cert.uploaded === true || cert.path?.includes('/uploads');
}

// 现代化确认弹窗组件
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs border border-orange-200 animate-fadein">
        <div className="font-bold text-lg mb-4 text-gray-800">{title}</div>
        <div className="mb-6 text-gray-700 text-base">{message}</div>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200">取消</button>
          <button onClick={onConfirm} className="px-5 py-2 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600">确定</button>
        </div>
      </div>
    </div>
  );
}

export default function Cert() {
  const [loading, setLoading] = useState(false);
  const [caResult, setCaResult] = useState(null);
  const [certs, setCerts] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainForm, setDomainForm] = useState({ domain: '', ip: '', name: '' });
  const [domainLoading, setDomainLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCertFile, setUploadCertFile] = useState(null);
  const [uploadKeyFile, setUploadKeyFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadCertName, setUploadCertName] = useState('');

  // 现代化确认弹窗状态
  const [confirmModal, setConfirmModal] = useState({ open: false, cert: null });

  // 证书列表多选状态
  const [selectedRows, setSelectedRows] = useState([]);

  const fetchCerts = async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/cert/list");
      const data = await res.json();
      setCerts(data.certs || []);
    } catch {
      setCerts([]);
    }
    setListLoading(false);
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleGenerateCA = async () => {
    setLoading(true);
    setCaResult(null);
    try {
      const res = await fetch("/api/cert/ca", { method: "POST" });
      const data = await res.json();
      setCaResult(data);
      fetchCerts();
      if (data.success) {
        toast.success(data.message || "CA根证书生成成功", { duration: TOAST_DURATION });
      } else {
        toast.error(data.message || "生成失败", { duration: TOAST_DURATION });
      }
    } catch (e) {
      setCaResult({ success: false, message: "请求失败" });
      toast.error("请求失败", { duration: TOAST_DURATION });
    }
    setLoading(false);
  };

  // 下载证书和私钥，支持“其他证书”目录
  const handleDownloadBoth = (cert) => {
    // 判断是否为“其他证书”
    const isOther = cert.type === '其他证书' || cert.uploaded;
    // 下载crt
    const crtUrl = isOther
      ? cert.path // 直接用后端返回的path字段 (/certs/uploads/xxx.crt )
      : `/api/cert/download?type=cert&domain=${encodeURIComponent(cert.domain || cert.name)}`;
    const crtLink = document.createElement('a');
    crtLink.href = crtUrl;
    crtLink.download = cert.domain || cert.name;
    document.body.appendChild(crtLink);
    crtLink.click();
    document.body.removeChild(crtLink);
    // 下载证书密钥, CA证书不下载
    if (cert.key && cert.type !== '根证书') {
      const keyUrl = isOther
        ? crtUrl.replace(/\.(crt|pem|cer)$/i, '.key')
        : `/api/cert/download?type=key&domain=${encodeURIComponent(cert.domain || cert.name)}`;
      const keyLink = document.createElement('a');
      keyLink.href = keyUrl;
      keyLink.download = (cert.domain || cert.name).replace(/\.(crt|pem|cer)$/i, '.key');
      document.body.appendChild(keyLink);
      keyLink.click();
      document.body.removeChild(keyLink);
    }
  };

  // 删除证书，支持其他证书
  const handleDeleteCert = (cert) => {
    setConfirmModal({ open: true, cert });
  };
  // 真正执行删除
  const doDeleteCert = async () => {
    const cert = confirmModal.cert;
    let domain = cert.domain;
    if (cert.type === '其他证书' || cert.uploaded) {
      domain = cert.name;
    }
    setConfirmModal({ open: false, cert: null });
    try {
      const res = await fetch(`/api/cert/delete?domain=${encodeURIComponent(domain)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchCerts();
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  // 域名证书弹窗相关
  const openDomainModal = () => {
    setDomainForm({ domain: '', ip: '', name: '' });
    setShowDomainModal(true);
  };
  const closeDomainModal = () => {
    setShowDomainModal(false);
  };
  const handleDomainInput = (e) => {
    const { name, value } = e.target;
    setDomainForm(f => ({ ...f, [name]: value }));
  };
  const canSubmitDomain = (domainForm.domain && domainForm.domain.trim()) || (domainForm.ip && domainForm.ip.trim());
  const handleDomainSubmit = async () => {
    if (!canSubmitDomain) return;
    setDomainLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('domain', domainForm.domain);
      params.append('ip', domainForm.ip);
      const res = await fetch(`/api/cert/domain?${params.toString()}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("证书生成成功", { duration: TOAST_DURATION });
        setShowDomainModal(false);
        fetchCerts();
      } else {
        toast.error(data.message || "生成失败", { duration: TOAST_DURATION });
      }
    } catch {
      toast.error("生成失败", { duration: TOAST_DURATION });
    }
    setDomainLoading(false);
  };

  // 上传证书弹窗相关
  const openUploadModal = () => {
    setUploadCertFile(null);
    setUploadKeyFile(null);
    setUploadCertName('');
    setShowUploadModal(true);
  };
  const closeUploadModal = () => {
    setShowUploadModal(false);
  };
  const handleCertFileChange = (e) => {
    setUploadCertFile(e.target.files[0] || null);
  };
  const handleKeyFileChange = (e) => {
    setUploadKeyFile(e.target.files[0] || null);
  };
  const handleUploadBoth = async () => {
    if (!uploadCertFile || !uploadKeyFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadCertFile);
    formData.append('key', uploadKeyFile);
    let certName = uploadCertName.trim();
    if (!certName && uploadCertFile) {
      certName = uploadCertFile.name.replace(/\.(crt|pem|cer)$/i, '');
    }
    formData.append('name', certName);
    try {
      const res = await fetch('/api/cert/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || '上传成功');
        fetchCerts();
        setShowUploadModal(false);
      } else {
        toast.error(data.message || '上传失败');
      }
    } catch {
      toast.error('上传失败');
    }
    setUploading(false);
  };

  // 证书排序：CA > 域名证书/泛域名证书 > 其他证书
  const sortedCerts = [...certs].sort((a, b) => {
    // CA最前
    if ((a.domain === 'SSLinker') !== (b.domain === 'SSLinker')) return a.domain === 'SSLinker' ? -1 : 1;
    // 其他证书最后
    if ((a.type === '其他证书') !== (b.type === '其他证书')) return a.type === '其他证书' ? 1 : -1;
    // 其它按域名字母顺序
    return (a.domain || a.name || '').localeCompare(b.domain || b.name || '');
  });

  // 分页相关
  const PAGE_SIZE = 7;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sortedCerts.length / PAGE_SIZE));
  const pagedCerts = sortedCerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };
  const handlePageJump = (e) => {
    let v = Number(e.target.value);
    if (!v) v = 1;
    if (v > totalPages) v = totalPages;
    if (v < 1) v = 1;
    setPage(v);
  };

  // 翻页时自动清空多选
  useEffect(() => { setSelectedRows([]); }, [page]);

  // 列表多选相关
  const handleSelectAll = () => {
    if (selectedRows.length === sortedCerts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(sortedCerts.map(cert => cert.domain || cert.name));
    }
  };
  const handleSelectRow = (row) => {
    if (selectedRows.includes(row)) {
      setSelectedRows(selectedRows.filter(r => r !== row));
    } else {
      setSelectedRows([...selectedRows, row]);
    }
  };

  // 刷新证书列表
  const handleRefresh = async () => {
    fetchCerts();
  };

  // 判断是否选中了根证书
  const hasCASelected = selectedRows.some(row => {
    const cert = sortedCerts.find(c => (c.domain || c.name) === row);
    return cert && isCA(cert);
  });

  // 删除按钮置灰逻辑：只要选中了根证书就置灰，全选所有证书则不置灰
  const allCertCount = sortedCerts.length;
  const allSelected = selectedRows.length === allCertCount;
  const canDeleteSelected = selectedRows.length > 0 && (!hasCASelected || allSelected);

  // 删除选中证书
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    try {
      const res = await fetch('/api/cert/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: selectedRows }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        fetchCerts();
        setSelectedRows([]);
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start bg-white pt-10 pb-2">
      <Toaster position="top-center" />
      <div className="w-full max-w-5xl flex flex-row gap-8 mb-8 rounded-2xl shadow-lg bg-white py-4 px-8">
        {/* CA根证书卡片 */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl shadow-sm py-6 px-4 animate-cert-card">
          <div className="flex items-center mb-6">
            <h3 className="text-2xl font-bold text-blue-800 mb-0 tracking-wide">CA根证书</h3>
            <span className="ml-3 px-3 py-0.5 bg-green-200 text-green-700 text-base rounded">CA</span>
          </div>
          <button
            className="w-56 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 font-bold text-xl transition focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
            onClick={handleGenerateCA}
            disabled={loading}
          >
            {loading ? "正在生成..." : "生成CA根证书"}
          </button>
        </div>
        {/* 域名证书卡片 */}
        <div className="flex-1 flex flex-col items-center justify-center bg-orange-50 rounded-xl shadow-sm py-6 px-4 animate-cert-card">
          <h3 className="text-2xl font-bold text-orange-600 mb-6 tracking-wide">域名证书</h3>
          <button
            className={`w-56 h-12 rounded-full shadow-lg font-bold text-xl transition focus:outline-none focus:ring-2 focus:ring-orange-300 
              ${certs.some(cert => cert.type === '根证书')
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
            onClick={certs.some(cert => cert.type === '根证书') ? openDomainModal : undefined}
            disabled={!certs.some(cert => cert.type === '根证书')}
          >
            生成域名证书
          </button>
        </div>
      </div>
      {/* 域名证书弹窗 */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 animate-cert-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl px-12 py-10 w-[430px] relative border-2 border-orange-100 animate-cert-modal">
            <div className="absolute right-6 top-6 cursor-pointer text-gray-400 hover:text-orange-400 text-2xl font-bold" onClick={closeDomainModal}>
              ×
            </div>
            <div className="flex items-center mb-6">
              <span className="text-3xl font-extrabold text-orange-600">生成域名证书</span>
              <span className="ml-3 px-3 py-0.5 bg-orange-100 text-orange-600 text-base rounded-full font-bold">自动</span>
            </div>
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-700 mb-1">域名 <span className="text-gray-400 text-base font-normal"></span></label>
              <input name="domain" value={domainForm.domain} onChange={handleDomainInput} className="w-full border-2 border-orange-200 px-3 py-2 rounded-xl text-base focus:border-orange-400 focus:outline-none transition" placeholder="如 example.com" />
            </div>
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-700 mb-1">IP地址 <span className="text-gray-400 text-base font-normal">(非必须)</span></label>
              <input name="ip" value={domainForm.ip} onChange={handleDomainInput} className="w-full border-2 border-orange-200 px-3 py-2 rounded-xl text-base focus:border-orange-400 focus:outline-none transition" placeholder="如 1.2.3.4 ，多个IP用逗号分隔" />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button className="px-7 py-2 rounded-full bg-gray-100 border border-gray-300 text-gray-500 font-bold text-lg hover:bg-gray-200 transition" onClick={closeDomainModal} disabled={domainLoading}>取消</button>
              <button className="px-8 py-2 rounded-full bg-orange-400 text-white font-bold text-lg hover:bg-orange-500 transition disabled:opacity-60"
                onClick={handleDomainSubmit}
                disabled={domainLoading || !canSubmitDomain}
              >
                {domainLoading ? "生成中..." : "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 证书列表和浮动操作卡片布局 */}
      <div className="w-full max-w-5xl flex flex-row gap-8 mt-2">
        {/* 列表 */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-8 animate-cert-card">
            <div className="overflow-x-auto">
              <table className="w-full text-base rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-blue-100 text-blue-700 text-lg">
                    <th className="py-3 px-2 text-center w-12">
                      <span className="inline-flex items-center justify-center">
                        <input type="checkbox"
                          id="cb-all"
                          checked={selectedRows.length === sortedCerts.length && sortedCerts.length > 0}
                          onChange={handleSelectAll}
                          className="peer appearance-none h-5 w-5 border-2 border-blue-500 rounded bg-white align-middle cursor-pointer transition"
                        />
                        <svg className="absolute pointer-events-none w-4 h-4 text-blue-500" style={{ display: selectedRows.length === sortedCerts.length && sortedCerts.length > 0 ? 'block' : 'none' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4 8-8" />
                        </svg>
                      </span>
                    </th>
                    <th className="py-3 px-4 text-left">证书名称</th>
                    <th className="py-3 px-4 text-left">类型</th>
                  </tr>
                </thead>
                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan={3} className="text-gray-400 text-center py-6">加载中...</td>
                    </tr>
                  ) : sortedCerts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-gray-400 text-center py-10 text-lg">暂无证书</td>
                    </tr>
                  ) : pagedCerts.map(cert => (
                    <tr key={cert.domain || cert.name} className="border-b last:border-none hover:bg-blue-50 transition-all group animate-cert-row" style={{ animationDelay: `${0.07 + (0.04 * (sortedCerts.indexOf(cert)))}s`, animationFillMode: 'backwards' }}>
                      <td className="py-4 px-2 text-center">
                        <span className="inline-flex items-center justify-center">
                          <input
                            type="checkbox"
                            id={`row-cb-${cert.domain || cert.name}`}
                            checked={selectedRows.includes(cert.domain || cert.name)}
                            onChange={() => handleSelectRow(cert.domain || cert.name)}
                            className="peer appearance-none h-5 w-5 border-2 border-blue-500 rounded bg-white align-middle cursor-pointer transition"
                          />
                          <svg className="absolute pointer-events-none w-4 h-4 text-blue-500" style={{ display: selectedRows.includes(cert.domain || cert.name) ? 'block' : 'none' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4 8-8" />
                          </svg>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-left font-mono text-lg text-blue-900 flex items-center">
                        {cert.domain || cert.name}
                        {isCA(cert) && <span className="ml-2 px-3 py-0.5 bg-green-200 text-green-800 text-xs rounded-lg border border-green-200">CA</span>}
                        {isWildcard(cert) && !isCA(cert) && (
                          <span className="ml-2 px-3 py-0.5 bg-orange-200 text-orange-600 text-xs rounded-lg border border-orange-200">泛</span>
                        )}
                        {isUploaded(cert) && !isCA(cert) && (
                          <span className="ml-2 px-3 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-lg border border-orange-200 font-semibold">其他</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-left text-lg text-blue-700">
                        {isCA(cert) ? '根证书' : isUploaded(cert) ? '其他证书' : isWildcard(cert) ? '泛域名证书' : '域名证书'}
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6 mb-2">
                <button
                  className={`px-5 py-2 rounded-full font-bold text-base shadow-md transition-all duration-150 
        ${page === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-300 text-white hover:bg-blue-500 active:scale-95'}`}
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  上一页
                </button>
                <span className="text-base text-gray-700 font-bold">第</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={handlePageJump}
                  className="w-14 px-2 py-1 rounded-lg border-2 border-blue-200 text-center font-extrabold text-lg mx-1 focus:border-blue-400 focus:outline-none transition bg-white shadow-sm"
                  style={{ boxShadow: '0 2px 8px rgba(34,197,94,0.08)' }}
                />
                <span className="text-base text-gray-700 font-bold">/ {totalPages} 页</span>
                <button
                  className={`px-5 py-2 rounded-full font-bold text-base shadow-md transition-all duration-150 
        ${page === totalPages ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-300 text-white hover:bg-blue-500 active:scale-95'}`}
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>
        {/* 操作按钮浮动卡片 */}
        <div className="w-40 flex-shrink-0">
          <div
            className="bg-white rounded-2xl shadow-lg px-2 py-4 flex flex-col items-center justify-start animate-cert-card"
            style={{ position: 'sticky', top: 280, zIndex: 20, height: 245 }}
          >
            <button
              className="w-32 mb-4 px-3 py-2 rounded-full font-bold text-base shadow transition-all bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleRefresh}
            >刷新</button>
            <button
              className="w-32 mb-4 px-3 py-2 rounded-full font-bold text-base shadow transition-all bg-orange-500 text-white hover:bg-orange-600"
              onClick={openUploadModal}
            >上传</button>
            <button
              className={`w-32 mb-4 px-3 py-2 rounded-full font-bold text-base shadow transition-all ${selectedRows.length === 1 ? 'bg-green-500 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
              disabled={selectedRows.length !== 1}
              onClick={() => {
                if (selectedRows.length === 1) {
                  const cert = sortedCerts.find(c => (c.domain || c.name) === selectedRows[0]);
                  if (cert) handleDownloadBoth(cert);
                }
              }}
            >下载</button>
            <button
              className={`w-32 mb-4 px-3 py-2 rounded-full font-bold text-base shadow transition-all ${canDeleteSelected ? 'bg-red-500 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
              disabled={!canDeleteSelected}
              onClick={handleDeleteSelected}
            >删除</button>
          </div>
        </div>
      </div>
      {/* 上传证书弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-cert-modal border border-orange-200">
            <h3 className="text-2xl font-bold text-orange-600 mb-6 tracking-wide flex items-center">
              <span className="mr-2">上传其他证书</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-lg border border-orange-200 font-semibold">自定义</span>
            </h3>
            <div className="mb-5 text-left">
              <label className="block text-gray-700 font-semibold mb-2">证书名称 <span className="text-gray-400 text-sm"> (可选，默认为证书文件名 )</span></label>
              <input
                type="text"
                className="w-56 px-3 py-2 rounded-lg border-2 border-orange-200 focus:outline-none focus:border-orange-400 bg-white text-base text-orange-700 transition"
                value={uploadCertName}
                onChange={e => setUploadCertName(e.target.value)}
                maxLength={64}
              />
            </div>
            <div className="mb-5 text-left">
              <label className="block text-gray-700 font-semibold mb-2">证书文件 <span className="text-gray-400 text-sm">(.crt/.pem/.cer)</span><span className="text-red-500 ml-1">*</span></label>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  className="w-56 px-3 py-2 rounded-lg border-2 border-orange-200 focus:outline-none focus:border-orange-400 bg-white text-base font-mono text-orange-600 placeholder-orange-200 transition"
                  value={uploadCertFile ? uploadCertFile.name : ''}
                  placeholder=""
                  readOnly
                />
                <label className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 font-semibold cursor-pointer hover:bg-orange-100 transition select-none shadow-sm">
                  选择证书
                  <input type="file" accept=".crt,.pem,.cer" className="hidden" onChange={handleCertFileChange} />
                </label>
              </div>
            </div>
            <div className="mb-7 text-left">
              <label className="block text-gray-700 font-semibold mb-2">私钥文件 <span className="text-gray-400 text-sm">(.key)</span><span className="text-red-500 ml-1">*</span></label>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  className="w-56 px-3 py-2 rounded-lg border-2 border-orange-200 focus:outline-none focus:border-orange-400 bg-white text-base font-mono text-orange-600 placeholder-orange-200 transition"
                  value={uploadKeyFile ? uploadKeyFile.name : ''}
                  placeholder=""
                  readOnly
                />
                <label className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 font-semibold cursor-pointer hover:bg-orange-100 transition select-none shadow-sm">
                  选择私钥
                  <input type="file" accept=".key" className="hidden" onChange={handleKeyFileChange} />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button className="px-5 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 font-semibold transition text-lg" onClick={closeUploadModal} disabled={uploading}>取消</button>
              <button
                className={
                  "px-7 py-2 rounded-full bg-orange-500 text-white font-bold text-lg shadow-md " +
                  (uploading || !uploadCertFile || !uploadKeyFile
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-orange-600")
                }
                onClick={handleUploadBoth}
                disabled={uploading || !uploadCertFile || !uploadKeyFile}
              >{uploading ? '上传中...' : '确定'}</button>
            </div>
          </div>
        </div>
      )}
      {/* 现代化确认弹窗 */}
      <ConfirmModal
        open={confirmModal.open}
        title="删除证书"
        message={`确定要删除证书“${confirmModal.cert ? (confirmModal.cert.name || confirmModal.cert.domain) : ''}”吗？`}
        onConfirm={doDeleteCert}
        onCancel={() => setConfirmModal({ open: false, cert: null })}
      />
      <style>{`
        @keyframes cert-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cert-modal-in {
          from { opacity: 0; transform: scale(0.97) translateY(32px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cert-card-up {
          from { opacity: 0; transform: translateY(36px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cert-row-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-cert-fade-in { animation: cert-fade-in 0.5s cubic-bezier(.4,0,.2,1) both; }
        .animate-cert-modal { animation: cert-modal-in 0.7s cubic-bezier(.4,0,.2,1) both; }
        .animate-cert-card { animation: cert-card-up 0.7s cubic-bezier(.4,0,.2,1) both; transition: box-shadow 0.3s, transform 0.3s; }
        .animate-cert-row { animation: cert-row-up 0.5s cubic-bezier(.4,0,.2,1) both; }
        .animate-cert-card:hover {
          transform: scale(1.025);
          box-shadow: 0 12px 36px rgba(200,200,200,0.20), 0 4px 16px rgba(200,200,200,0.20);
        }
        .animate-cert-row:hover {
          background: #f0f9ff !important;
          transform: scale(1.01);
        }
      `}</style>
    </div>
  );
}
