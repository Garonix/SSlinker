import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Cert from "./pages/Cert";
import Nginx from "./pages/Nginx";
import Guide from "./pages/Guide";

function Navbar() {
  const { pathname } = useLocation();
  const navs = [
    { name: "首页", path: "/" },
    { name: "证书管理", path: "/cert" },
    { name: "反向代理", path: "/nginx" },
    { name: "使用指南", path: "/guide" },
  ];
  return (
    <nav className="bg-white/90 backdrop-blur border-b border-blue-100 shadow-md px-10 py-3 flex justify-between items-center sticky top-0 z-50">
      <span className="text-2xl font-extrabold text-blue-700 tracking-wide select-none drop-shadow-sm">SSLinker</span>
      <div className="flex gap-2 items-center">
        {navs.map((nav) => (
          <Link
            key={nav.path}
            to={nav.path}
            className={`px-5 py-2 rounded-full transition font-bold text-base shadow-sm hover:bg-blue-50 hover:text-blue-700 hover:shadow-md duration-200 ${pathname === nav.path ? "bg-blue-100 text-blue-700 shadow-md" : "text-gray-700"}`}
          >
            {nav.name}
          </Link>
        ))}
        {/* Star GitHub 按钮 */}
        <a
          href="https://github.com/Garonix/SSlinker"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-3 flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-bold shadow-sm hover:bg-yellow-200 hover:text-yellow-800 transition duration-200"
          title="Star on GitHub"
        >
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.386-2.46a1 1 0 00-1.175 0l-3.386 2.46c-.784.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
          </svg>
          Star
        </a>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cert" element={<Cert />} />
        <Route path="/nginx" element={<Nginx />} />
        <Route path="/guide" element={<Guide />} />
      </Routes>
    </Router>
  );
}

export default App;
