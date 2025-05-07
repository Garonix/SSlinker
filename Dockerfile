# 基于Python和Node的多阶段构建，适用于SSlinker全栈项目

# ====== 前端构建阶段 ======
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend .
RUN yarn build

# ====== 后端构建阶段 ======
FROM python:3.10-slim AS backend-build
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend .

# ====== 运行阶段 ======
FROM python:3.10-slim
WORKDIR /app
COPY --from=backend-build /app/backend ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
# 端口暴露仅供需要时使用，默认不暴露
EXPOSE 8000
ENV PYTHONUNBUFFERED=1
# 启动命令：生产环境建议用gunicorn/uvicorn或自定义
CMD ["python", "./backend/main.py"]
