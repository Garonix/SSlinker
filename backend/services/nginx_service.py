# nginx相关服务函数（伪实现，后续补充）
def generate_nginx_config(domain, proxy_pass):
    return {"success": True, "config_path": f"/nginx/conf.d/{domain}.conf"}

def list_nginx_configs():
    return {"configs": []}

def delete_nginx_config(domain):
    return {"success": True}

def reload_nginx():
    return {"success": True, "message": "nginx reloaded"}
