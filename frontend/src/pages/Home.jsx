import React from "react";

export default function Home() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-xl w-full px-6 py-12 bg-white/80 rounded-2xl shadow-xl flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-4 tracking-tight text-center drop-shadow">内网SSL证书与反向代理管理平台</h1>
        <p className="text-lg text-gray-600 mb-8 text-center">一站式证书申请、nginx配置、状态监控，界面现代美观，操作简单易用。</p>
        <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
          <a href="/cert" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 font-semibold text-center transition">证书管理</a>
          <a href="/nginx" className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 font-semibold text-center transition">nginx配置</a>
          <a href="/status" className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 font-semibold text-center transition">系统状态</a>
        </div>
      </div>
      <footer className="mt-16 text-gray-400 text-xs text-center select-none">
        {new Date().getFullYear()} SSLinker 内网SSL证书与反向代理平台
      </footer>
    </main>
  );
}
