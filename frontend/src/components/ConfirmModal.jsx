import React from "react";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs border border-green-200 animate-fadein">
        <div className="font-bold text-lg mb-4 text-gray-800">{title}</div>
        <div className="mb-6 text-gray-700 text-base">{message}</div>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200">取消</button>
          <button onClick={onConfirm} className="px-5 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700">确定</button>
        </div>
      </div>
    </div>
  );
}
