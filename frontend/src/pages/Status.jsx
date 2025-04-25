import React from "react";

export default function Status() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">系统状态</h2>
      <p className="text-gray-600 mb-8">查看nginx服务、证书、配置等系统运行状态。</p>
      {/* 后续补充状态展示和日志 */}
      <div className="w-full max-w-md bg-gray-50 p-6 rounded shadow text-center">
        <span className="text-gray-400">功能开发中...</span>
      </div>
    </div>
  );
}
