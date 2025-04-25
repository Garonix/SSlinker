# FastAPI 主入口
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import cert, nginx, system

app = FastAPI()

# 允许前端跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由注册
app.include_router(cert.router, prefix="/api/cert")
app.include_router(nginx.router, prefix="/api/nginx")
app.include_router(system.router, prefix="/api")
