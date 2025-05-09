import React from "react";
import toast from 'react-hot-toast';

/**
 * 通用 Hosts 复制弹窗
 * @param {boolean} open - 是否显示弹窗
 * @param {function} onClose - 关闭回调
 * @param {string[]} hostsLines - hosts规则（每行一个）
 * @param {string} [command] - 可选，powershell命令
 */
export default function HostsModal({ open, onClose, hostsLines = [], command }) {
  if (!open) return null;
  const hostsText = hostsLines.join('\n');
  const psCmd = command ||
    'powershell.exe -Command "Start-Process -FilePath notepad.exe -Verb RunAs -ArgumentList \"$env:SystemRoot\\system32\\drivers\\etc\\hosts\""';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-nginx-modal">
        <div className="font-bold text-lg mb-4 text-blue-700">提示</div>
        <div className="mb-6 text-gray-700 text-base break-words">
          请按下 <span className="font-bold text-blue-600">windows + R</span> 键打开 <span className="font-bold">运行</span> 面板，输入：<br/>
          <span className="block my-2 bg-gray-100 px-2 py-1 rounded text-xs font-mono text-blue-700 select-all">
            {psCmd}
          </span>
        </div>
        <div className="mb-6">
          <div className="font-semibold text-gray-800 mb-1">Hosts规则：</div>
          <textarea
            className="w-full px-2 py-1 rounded border border-gray-200 bg-gray-50 text-sm text-gray-700 font-mono resize-none"
            value={hostsText}
            rows={hostsLines.length > 3 ? 5 : 3}
            readOnly
            style={{ minHeight: 48 }}
          />
        </div>
        <div className="flex justify-center gap-4">
          <button
            className="px-5 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600"
            onClick={() => {
              navigator.clipboard.writeText(psCmd);
              toast.success('命令已复制');
            }}
          >复制命令</button>
          <button
            className="px-5 py-2 bg-green-500 text-white rounded-full font-bold hover:bg-green-600"
            onClick={() => {
              if (!hostsText) return toast.error('无可复制内容');
              navigator.clipboard.writeText(hostsText);
              toast.success('hosts已复制');
            }}
          >复制hosts</button>
          <button
            className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200"
            onClick={onClose}
          >取消</button>
        </div>
      </div>
    </div>
  );
}
