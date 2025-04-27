import React, { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';

const TOAST_DURATION = 3000;

function isCA(cert) {
  return cert.domain === 'SSLinker';
}

export default function Cert() {
  const [loading, setLoading] = useState(false);
  const [caResult, setCaResult] = useState(null);
  const [certs, setCerts] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainForm, setDomainForm] = useState({ domain: '', ip: '', name: '' });
  const [domainLoading, setDomainLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

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

  // 同时下载crt和key，没有key只下载crt
  const handleDownloadBoth = (cert) => {
    // 下载crt
    const crtUrl = `/api/cert/download?type=cert&domain=${encodeURIComponent(cert.domain || cert.name)}`;
    const crtLink = document.createElement('a');
    crtLink.href = crtUrl;
    crtLink.download = `${cert.domain || cert.name}.crt`;
    document.body.appendChild(crtLink);
    crtLink.click();
    document.body.removeChild(crtLink);
    // 下载key（如果有）
    if (cert.key) {
      const keyUrl = `/api/cert/download?type=key&domain=${encodeURIComponent(cert.domain || cert.name)}`;
      const keyLink = document.createElement('a');
      keyLink.href = keyUrl;
      keyLink.download = `${cert.domain || cert.name}.key`;
      document.body.appendChild(keyLink);
      keyLink.click();
      document.body.removeChild(keyLink);
    }
  };

  const handleDelete = async (domain) => {
    if (!window.confirm(`确定要删除证书 ${domain} 吗？`)) return;
    try {
      const res = await fetch(`/api/cert/delete?domain=${encodeURIComponent(domain)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("删除成功", { duration: TOAST_DURATION });
        fetchCerts();
      } else {
        toast.error(data.message || "删除失败", { duration: TOAST_DURATION });
      }
    } catch {
      toast.error("请求失败", { duration: TOAST_DURATION });
    }
  };

  // 清空所有证书（包括CA）
  const handleClearAll = async () => {
    if (!window.confirm("确定要清空所有证书（包括CA）吗？此操作不可恢复！")) return;
    setClearLoading(true);
    try {
      const res = await fetch(`/api/cert/clear`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("已清空所有证书", { duration: TOAST_DURATION });
        fetchCerts();
      } else {
        toast.error(data.message || "清空失败", { duration: TOAST_DURATION });
      }
    } catch {
      toast.error("请求失败", { duration: TOAST_DURATION });
    }
    setClearLoading(false);
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

  return (
    <div className="flex flex-col items-center justify-start bg-white pt-10 pb-2">
      <Toaster position="top-center" />
      {/* <h2 className="text-3xl font-bold mb-6 text-blue-700">证书管理</h2> */}
      <div className="w-full max-w-5xl flex flex-row gap-8 mb-8 rounded-2xl shadow-lg bg-white py-4 px-8">
        {/* CA根证书卡片 */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl shadow-sm py-6 px-4">
          <div className="flex items-center mb-6">
            <h3 className="text-2xl font-bold text-blue-800 mb-0">CA根证书</h3>
            <span className="ml-3 px-3 py-1 bg-green-200 text-green-700 text-base rounded">CA</span>
          </div>
          <button
            className="w-56 h-12 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 font-bold text-lg transition disabled:opacity-60"
            onClick={handleGenerateCA}
            disabled={loading}
          >
            {loading ? "正在生成..." : "生成CA根证书"}
          </button>
        </div>
        {/* 域名证书卡片 */}
        <div className="flex-1 flex flex-col items-center justify-center bg-orange-50 rounded-xl shadow-sm py-6 px-4">
          <h3 className="text-2xl font-bold text-orange-600 mb-6">域名证书</h3>
          <button
            className="w-56 h-12 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 font-bold text-lg transition disabled:opacity-60"
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
          {/* <h3 className="text-xl font-bold text-gray-800 mb-0">已生成证书</h3> */}
          <button
            className="px-4 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300 font-semibold transition disabled:opacity-60"
            onClick={handleClearAll}
            disabled={clearLoading}
          >{clearLoading ? "清空中..." : "清空证书"}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700">
                <th className="py-3 px-4 font-bold text-base text-left tracking-wide">证书名称</th>
                <th className="py-3 px-4 font-bold text-base text-left tracking-wide">类型</th>
                <th className="py-3 px-4 font-bold text-base text-left tracking-wide">操作</th>
              </tr>
            </thead>
            <tbody>
              {certs.map(cert => (
                <tr key={cert.domain || cert.name} className="border-b last:border-none hover:bg-blue-50 transition-all group">
                  <td className="py-3 px-4 text-left flex items-center">
                    {cert.domain || cert.name}
                    {isCA(cert) && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-lg border border-green-200">CA</span>}
                  </td>
                  <td className="py-3 px-4 text-left">
                    {isCA(cert) ? '根证书' : '域名证书'}
                  </td>
                  <td className="py-3 px-4 text-left">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-700 shadow-sm mr-2 transition-all"
                      onClick={() => handleDownloadBoth(cert)}
                    >下载</button>
                    {!isCA(cert) && (
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-700 shadow-sm transition-all"
                        onClick={() => handleDelete(cert.domain || cert.name)}
                      >删除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {listLoading ? (
          <div className="text-gray-400 mt-4">加载中...</div>
        ) : certs.length === 0 ? (
          <div className="text-gray-400 mt-4">暂无证书</div>
        ) : null}
      </div>
    </div>
  );
}
