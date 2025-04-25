import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Cert from "./pages/Cert";
import Nginx from "./pages/Nginx";
import Status from "./pages/Status";

function Navbar() {
  const { pathname } = useLocation();
  const navs = [
    { name: "首页", path: "/" },
    { name: "证书管理", path: "/cert" },
    { name: "nginx配置", path: "/nginx" },
    { name: "系统状态", path: "/status" },
  ];
  return (
    <nav className="bg-white/80 backdrop-blur border-b shadow-sm px-6 py-2 flex justify-between items-center sticky top-0 z-50">
      <span className="text-xl font-bold text-blue-700 tracking-wide select-none">SSLinker</span>
      <div className="flex gap-4">
        {navs.map((nav) => (
          <Link
            key={nav.path}
            to={nav.path}
            className={`px-3 py-1 rounded transition font-medium hover:bg-blue-50 hover:text-blue-700 ${pathname === nav.path ? "bg-blue-100 text-blue-700" : "text-gray-700"}`}
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
        <Route path="/status" element={<Status />} />
      </Routes>
    </Router>
  );
}

export default App;
