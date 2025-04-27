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
      ? cert.path // 直接用后端返回的path字段（/certs/uploads/xxx.crt）
      : `/api/cert/download?type=cert&domain=${encodeURIComponent(cert.domain || cert.name)}`;
    const crtLink = document.createElement('a');
    crtLink.href = crtUrl;
    crtLink.download = cert.domain || cert.name;
    document.body.appendChild(crtLink);
    crtLink.click();
    document.body.removeChild(crtLink);
    // 下载key（如果有）
    if (cert.key) {
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
  const handleDomainSubmit = async () => {
    if (!domainForm.domain) {
      toast.error("域名不能为空", { duration: TOAST_DURATION });
      return;
    }
    setDomainLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('domain', domainForm.domain);
      if (domainForm.ip) params.append('ip', domainForm.ip);
      const res = await fetch(`/api/cert/domain?${params.toString()}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "域名证书生成成功", { duration: TOAST_DURATION });
        setShowDomainModal(false);
        fetchCerts();
      } else {
        toast.error(data.message || "生成失败", { duration: TOAST_DURATION });
      }
    } catch {
      toast.error("请求失败", { duration: TOAST_DURATION });
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

  return (
    <div className="flex flex-col items-center justify-start bg-white pt-10 pb-2">
      <Toaster position="top-center" />
      <div className="w-full max-w-5xl flex flex-row gap-8 mb-8 rounded-2xl shadow-lg bg-white py-4 px-8">
        {/* CA根证书卡片 */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl shadow-sm py-6 px-4">
          <div className="flex items-center mb-6">
            <h3 className="text-2xl font-bold text-blue-800 mb-0 tracking-wide">CA根证书</h3>
            <span className="ml-3 px-3 py-1 bg-green-200 text-green-700 text-base rounded">CA</span>
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
        <div className="flex-1 flex flex-col items-center justify-center bg-orange-50 rounded-xl shadow-sm py-6 px-4">
          <h3 className="text-2xl font-bold text-orange-600 mb-6 tracking-wide">域名证书</h3>
          <button
            className="w-56 h-12 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 font-bold text-xl transition focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60"
            onClick={openDomainModal}
          >
            生成域名证书
          </button>
        </div>
      </div>
      {/* 域名证书弹窗 */}
      {showDomainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 w-full max-w-md relative animate-fadein">
            <h3 className="text-lg font-bold mb-4 text-blue-700">生成域名证书</h3>
            <div className="mb-3 text-left">
              <label className="block text-gray-600 mb-1">证书名称（域名/标识）<span className="text-red-500">*</span></label>
              <input name="domain" value={domainForm.domain} onChange={handleDomainInput} className="w-full border px-3 py-1 rounded" placeholder="如 example.com" />
            </div>
            <div className="mb-3 text-left">
              <label className="block text-gray-600 mb-1">IP地址（可选，多个用逗号分隔）</label>
              <input name="ip" value={domainForm.ip} onChange={handleDomainInput} className="w-full border px-3 py-1 rounded" placeholder="如 1.2.3.4,5.6.7.8" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={closeDomainModal} disabled={domainLoading}>取消</button>
              <button className="px-6 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleDomainSubmit} disabled={domainLoading}>
                {domainLoading ? "生成中..." : "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              className="px-4 py-2 bg-orange-100 text-orange-600 rounded-full border border-orange-200 font-semibold hover:bg-orange-200 transition select-none"
              onClick={openUploadModal}
            >上传证书</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-base rounded-xl overflow-hidden border-separate" style={{borderSpacing:0}}>
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700">
                <th className="py-4 px-4 font-bold text-lg text-left tracking-wide">证书名称</th>
                <th className="py-4 px-4 font-bold text-lg text-left tracking-wide">类型</th>
                <th className="py-4 px-4 font-bold text-lg text-center tracking-wide">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedCerts.map((cert, idx) => (
                <tr
                  key={cert.domain || cert.name}
                  className="hover:bg-blue-50 transition-all group"
                >
                  <td className={`py-4 px-4 text-left flex items-center font-mono text-lg text-blue-700`}>
                    {cert.domain || cert.name}
                    {isCA(cert) && <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-lg border border-green-200">CA</span>}
                    {isWildcard(cert) && !isCA(cert) && (
                      <span className="ml-2 px-2 py-0.5 bg-orange-200 text-orange-600 text-xs rounded-lg border border-orange-200">泛</span>
                    )}
                    {isUploaded(cert) && (
                      <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-lg border border-orange-200">其他</span>
                    )}
                  </td>
                  <td className={`py-4 px-4 text-left text-lg text-blue-700`}>
                    {isCA(cert) ? '根证书' : isUploaded(cert) ? '其他证书' : isWildcard(cert) ? '泛域名证书' : '域名证书'}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      className="px-5 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-700 shadow-sm transition-all text-base font-bold mr-2"
                      onClick={() => handleDownloadBoth(cert)}
                    >下载</button>
                    {!isCA(cert) && (
                      <button
                        className="px-5 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 shadow-sm transition-all text-base font-bold"
                        onClick={() => handleDeleteCert(cert)}
                      >删除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {listLoading ? (
          <div className="text-gray-400 mt-4 text-lg">加载中...</div>
        ) : certs.length === 0 ? (
          <div className="text-gray-400 mt-4 text-lg">暂无证书</div>
        ) : null}
      </div>
      {/* 上传证书弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fadein border border-orange-200">
            <h3 className="text-2xl font-bold text-orange-600 mb-6 tracking-wide flex items-center">
              <span className="mr-2">上传其他证书</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-lg border border-orange-200 font-semibold">自定义</span>
            </h3>
            <div className="mb-5 text-left">
              <label className="block text-gray-700 font-semibold mb-2">证书名称 <span className="text-gray-400 text-sm">（可选，默认为证书文件名）</span></label>
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
    </div>
  );
}
