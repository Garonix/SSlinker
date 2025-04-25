import React from "react";

export default function Nginx() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h2 className="text-2xl font-bold mb-4 text-green-700">nginx配置管理</h2>
      <p className="text-gray-600 mb-8">自动生成、管理和重载nginx反向代理配置。</p>
      {/* 后续补充配置表单和配置列表 */}
      <div className="w-full max-w-md bg-gray-50 p-6 rounded shadow text-center">
        <span className="text-gray-400">功能开发中...</span>
      </div>
    </div>
  );
}
