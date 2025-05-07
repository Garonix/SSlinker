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
      <div className="flex gap-2">
        {navs.map((nav) => (
          <Link
            key={nav.path}
            to={nav.path}
            className={`px-5 py-2 rounded-full transition font-bold text-base shadow-sm hover:bg-blue-50 hover:text-blue-700 hover:shadow-md duration-200 ${pathname === nav.path ? "bg-blue-100 text-blue-700 shadow-md" : "text-gray-700"}`}
          >
            {nav.name}
          </Link>
        ))}
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
