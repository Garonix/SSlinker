from fastapi import APIRouter, HTTPException
from backend.services.nginx_service import generate_nginx_config, list_nginx_configs, delete_nginx_config, reload_nginx, start_nginx, stop_nginx, read_local_addr, write_local_addr
import subprocess

router = APIRouter()

@router.post("/config")
def create_nginx_config(payload: dict):
    cert_domain = payload.get("cert_domain")
    server_name = payload.get("server_name")
    proxy_pass = payload.get("proxy_pass")
    if not cert_domain or not server_name or not proxy_pass:
        raise HTTPException(status_code=400, detail="参数不全")
    return generate_nginx_config(cert_domain, server_name, proxy_pass)

@router.get("/list")
def get_nginx_config_list():
    return list_nginx_configs()

@router.get("/local_addr")
def get_local_addr():
    return {"local_addr": read_local_addr()}

@router.post("/local_addr")
def set_local_addr(payload: dict):
    addr = payload.get("local_addr", "")
    ok = write_local_addr(addr)
    if ok:
        return {"success": True, "local_addr": addr}
    else:
        raise HTTPException(status_code=500, detail="保存失败")


@router.delete("/config")
def remove_nginx_config(domain: str):
    return delete_nginx_config(domain)

@router.post("/start")
def start_nginx_api():
    return start_nginx()

@router.post("/stop")
def stop_nginx_api():
    return stop_nginx()

@router.post("/reload")
def reload():
    return reload_nginx()

@router.get("/status")
def nginx_status():
    try:
        # systemctl 检查nginx服务状态
        result = subprocess.run(['systemctl', 'is-active', 'nginx'], capture_output=True, text=True)
        status = result.stdout.strip()
        if status == 'active':
            return {"status": "running"}
        elif status == 'inactive':
            return {"status": "stopped"}
    
    except Exception:
        return {"status": "error"}
    
    try:
        # service 检查
        result = subprocess.run(['service', 'nginx', 'status'], capture_output=True, text=True)
        status = result.stdout.strip()
        print(f"status: {status}")
        if "running" in status:
            return {"status": "running"}
        elif "not" in status:
            return {"status": "stopped"}
        return {"status": "error"}
    
    except Exception:
        return {"status": "error"}
