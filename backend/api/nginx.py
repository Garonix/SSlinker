from fastapi import APIRouter, HTTPException
from services.nginx_service import generate_nginx_config, list_nginx_configs, delete_nginx_config, reload_nginx

router = APIRouter()

@router.post("/config")
def create_nginx_config(payload: dict):
    domain = payload.get("domain")
    proxy_pass = payload.get("proxy_pass")
    if not domain or not proxy_pass:
        raise HTTPException(status_code=400, detail="参数不全")
    return generate_nginx_config(domain, proxy_pass)

@router.get("/list")
def get_nginx_config_list():
    return list_nginx_configs()

@router.delete("/config")
def remove_nginx_config(domain: str):
    return delete_nginx_config(domain)

@router.post("/reload")
def reload():
    return reload_nginx()
