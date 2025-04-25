# 前端开发环境初始化与Tailwind CSS配置说明

本说明文档帮助你快速完成前端开发环境的初始化及Tailwind CSS的配置。

---

## 一、前端项目初始化流程

1. 使用 Vite 创建 React 项目
   ```bash
   npm create vite@latest frontend -- --template react
   # 或使用 yarn
   yarn create vite frontend --template react
   ```

2. 进入项目目录
   ```bash
   cd frontend
   ```

3. 安装依赖
   ```bash
   npm install
   # 或
   yarn
   ```

4. 启动开发服务器
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

---

## 二、Tailwind CSS 安装与配置

1. 安装依赖
   ```bash
   yarn add tailwindcss postcss autoprefixer -D
   # 或
   npm install -D tailwindcss postcss autoprefixer
   ```

2. 初始化 Tailwind 配置
   ```bash
   npx tailwindcss init -p
   ```
   生成 tailwind.config.js 和 postcss.config.js。

3. 配置 Tailwind
   编辑 tailwind.config.js：
   ```js
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

4. 在 src/index.css 中引入 Tailwind 指令：
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

5. 确保 src/main.jsx 或 App.jsx 中有引入 index.css。

---

## 三、常见问题
- 启动报错请检查 node 版本、依赖安装是否完整。
- yarn/npm 混用可能导致 node_modules 冲突，建议统一使用一种包管理工具。
- Tailwind 无效一般为 content 配置路径不正确或未正确引入 index.css。

---

## 四、官方文档
- Vite: https://vitejs.dev/
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/docs/installation

如遇问题可随时查阅官方文档或向AI助手提问。
