import os
import re
import subprocess

# nginx相关服务函数 (伪实现，后续补充 )
def generate_nginx_config(cert_domain, server_name, proxy_pass):
    # 使用系统默认配置目录
    config_dir = '/etc/nginx/conf.d'
    if not os.path.exists(config_dir):
        os.makedirs(config_dir)
    # 以server_name为文件名，直接用原始域名 (保留.和* )
    config_path = os.path.join(config_dir, f'{server_name}.conf')
    template_path = os.path.join(os.path.dirname(__file__), 'template/nginx_https_server.template')
    with open(template_path, 'r', encoding='utf-8') as tf:
        template = tf.read()
    nginx_conf = template.replace('{{ server_name }}', server_name) \
                           .replace('{{ cert_domain }}', cert_domain) \
                           .replace('{{ proxy_pass }}', proxy_pass)
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(nginx_conf)
    print(f"[nginx配置生成] 写入文件: {config_path}")
    # 自动重载nginx
    reload_result = reload_nginx()
    if not reload_result.get('success'):
        return {"success": False, "message": f"配置写入成功，但重载失败: {reload_result.get('message', '')}", "config_path": config_path}
    return {"success": True, "config_path": config_path, "message": "配置写入并nginx已重载"}

def read_local_addr():
    local_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../config/local.txt'))
    if os.path.exists(local_path):
        try:
            with open(local_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except Exception:
            return ''
    return ''

def write_local_addr(addr):
    local_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../config/local.txt'))
    try:
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(addr.strip())
        return True
    except Exception:
        return False

def list_nginx_configs():    
    config_dir = '/etc/nginx/conf.d'
    configs = []
    if not os.path.exists(config_dir):
        return {"configs": [], "local_addr": read_local_addr()}
    for fname in os.listdir(config_dir):
        if fname.endswith('.conf'):
            # 恢复域名原样 (去掉.conf后缀即可 )
            domain = fname[:-5]
            config_path = os.path.join(config_dir, fname)
            # 如果文件不存在，自动删除该项 (冗余保护 )
            if not os.path.exists(config_path):
                try:
                    os.remove(config_path)
                except Exception:
                    pass
                continue
            proxy_pass = None
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    m = re.search(r'proxy_pass +([^;]+);', content)
                    if m:
                        proxy_pass = m.group(1).strip()
            except Exception:
                pass
            configs.append({
                "domain": domain,
                "proxy_pass": proxy_pass,
                "config_path": config_path
            })
    return {"configs": configs, "local_addr": read_local_addr()}

def delete_nginx_config(domain):
    config_dir = '/etc/nginx/conf.d'
    config_path = os.path.join(config_dir, f'{domain}.conf')
    if os.path.exists(config_path):
        try:
            os.remove(config_path)
            # 自动重载nginx
            reload_result = reload_nginx()
            if not reload_result.get('success'):
                return {"success": False, "message": f"配置删除成功，但重载失败: {reload_result.get('message', '')}"}
            return {"success": True, "message": "配置删除并nginx已重载"}
        except Exception as e:
            return {"success": False, "message": f"删除失败: {e}"}
    else:
        return {"success": False, "message": f"配置文件不存在: {config_path}"}

def start_nginx():
    try:
        out = subprocess.check_output(['nginx'], stderr=subprocess.STDOUT)
        return {"success": True, "message": out.decode('utf-8')}
    except subprocess.CalledProcessError as e:
        return {"success": False, "message": e.output.decode('utf-8')}
    except Exception as ex:
        return {"success": False, "message": str(ex)}

def stop_nginx():
    try:
        out = subprocess.check_output(['nginx', '-s', 'stop'], stderr=subprocess.STDOUT)
        return {"success": True, "message": out.decode('utf-8')}
    except subprocess.CalledProcessError as e:
        return {"success": False, "message": e.output.decode('utf-8')}
    except Exception as ex:
        return {"success": False, "message": str(ex)}

def reload_nginx():
    try:
        out = subprocess.check_output(['nginx', '-s', 'reload'], stderr=subprocess.STDOUT)
        return {"success": True, "message": out.decode('utf-8')}
    except subprocess.CalledProcessError as e:
        return {"success": False, "message": e.output.decode('utf-8')}
    except Exception as ex:
        return {"success": False, "message": str(ex)}
