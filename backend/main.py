# FastAPI 主入口
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from backend.api import cert, nginx, system

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

# 静态文件托管 (生产环境 )
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/")
    def read_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    
    # SPA 应用的 Fallback 路由
    # 这个路由必须放在所有具体的 API 路由、静态文件挂载、以及 "/" 路由**之后**
    # 它会捕获所有未被前面路由匹配到的路径，并返回 index.html
    @app.get("/{full_path:path}")
    async def serve_frontend_fallback(full_path: str):
        index_html_path = os.path.join(frontend_dist, "index.html")
        # 再次检查 index.html 是否存在，增加健壮性
        if os.path.exists(index_html_path):
             return FileResponse(index_html_path)
        else:
             # 如果 index.html 不存在， fallback 也无法工作
             return HTMLResponse(content="index.html文件不存在!", status_code=404)
