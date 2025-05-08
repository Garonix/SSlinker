# 基于Python和Node的多阶段构建，适用于SSlinker全栈项目

# ====== 前端构建阶段 ======
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend .
RUN yarn build

# ====== 后端构建与运行阶段 ======
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt ./backend/
RUN apt update && apt install -y --no-install-recommends openssl nginx && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r ./backend/requirements.txt
COPY backend ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start.sh
EXPOSE 8000 80 443
ENV PYTHONUNBUFFERED=1
CMD ["/usr/local/bin/start.sh"]
