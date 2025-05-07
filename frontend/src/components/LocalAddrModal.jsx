import React, { useState } from "react";

export default function LocalAddrModal({ open, onClose, onSubmit }) {
  const [localAddr, setLocalAddr] = useState("");

  const canSubmit = !!localAddr.trim();

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-blue-50 rounded-2xl shadow-2xl p-8 w-full max-w-xs border border-blue-200 animate-fadein">
        <div className="font-bold text-lg mb-4 text-blue-700">设置本机地址</div>
        <div className="mb-6 text-blue-700 text-base">请输入本机地址（如 192.168.1.100）</div>
        <input
          className="w-full px-4 py-2 mb-6 rounded-lg border-2 border-blue-300 bg-white text-base text-blue-700 focus:outline-none focus:border-blue-500 transition"
          placeholder="本机地址"
          value={localAddr}
          onChange={e => setLocalAddr(e.target.value)}
        />
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200">取消</button>
          <button
            onClick={() => canSubmit && onSubmit(localAddr)}
            className={`px-5 py-2 bg-blue-500 text-white rounded-full font-bold ${canSubmit ? 'hover:bg-blue-600' : 'opacity-60 cursor-not-allowed'}`}
            disabled={!canSubmit}
          >确定</button>
        </div>
      </div>
    </div>
  ) : null;
}
