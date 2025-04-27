import os
import subprocess

def generate_ca_cert():
    ca_dir = '/certs'
    os.makedirs(ca_dir, exist_ok=True)
    key_path = os.path.join(ca_dir, 'SSLinker.key')
    crt_path = os.path.join(ca_dir, 'SSLinker.crt')
    if os.path.exists(key_path) and os.path.exists(crt_path):
        return {"success": True, "ca_cert_path": crt_path, "ca_key_path": key_path, "message": "证书已存在，无需重复生成"}
    try:
        gen_key_cmd = [
            "openssl", "genrsa", "-out", key_path, "4096"
        ]
        print("生成私钥命令：", " ".join(gen_key_cmd))
        subprocess.run(gen_key_cmd, check=True)
        gen_ca_cmd = [
            "openssl", "req", "-x509", "-new", "-key", key_path, "-sha256", "-days", "7300",
            "-out", crt_path, "-subj", "/CN=SSLinker CA"
        ]
        print("生成CA证书命令：", " ".join(gen_ca_cmd))
        subprocess.run(gen_ca_cmd, check=True)
        return {"success": True, "ca_cert_path": crt_path, "ca_key_path": key_path, "message": "CA根证书生成成功"}
    except Exception as e:
        return {"success": False, "message": f"生成失败: {e}"}

def generate_domain_cert(domain, ip=None):
    import tempfile
    cert_dir = '/certs'
    os.makedirs(cert_dir, exist_ok=True)
    key_path = os.path.join(cert_dir, f'{domain}.key')
    csr_path = os.path.join(cert_dir, f'{domain}.csr')
    crt_path = os.path.join(cert_dir, f'{domain}.crt')
    ca_key_path = os.path.join(cert_dir, 'SSLinker.key')
    ca_crt_path = os.path.join(cert_dir, 'SSLinker.crt')
    if not os.path.exists(ca_key_path) or not os.path.exists(ca_crt_path):
        return {"success": False, "message": "请先生成CA根证书"}
    try:
        gen_key_cmd = ["openssl", "genrsa", "-out", key_path, "2048"]
        print("生成域名私钥命令：", " ".join(gen_key_cmd))
        subprocess.run(gen_key_cmd, check=True)
        # 生成带有 SAN 的 openssl 配置文件
        with tempfile.NamedTemporaryFile('w+', delete=False) as tmpconf:
            tmpconf.write('[req]\ndistinguished_name=req_distinguished_name\nreq_extensions=v3_req\n[req_distinguished_name]\n[v3_req]\nsubjectAltName=@alt_names\n[alt_names]\n')
            tmpconf.write(f'DNS.1={domain}\n')
            # 支持多个IP
            if ip:
                for idx, ipval in enumerate(ip.split(',')):
                    tmpconf.write(f'IP.{idx+1}={ipval.strip()}\n')
            conf_path = tmpconf.name
        subj = f"/CN={domain}"
        gen_csr_cmd = ["openssl", "req", "-new", "-key", key_path, "-out", csr_path, "-subj", subj, "-config", conf_path, "-reqexts", "v3_req"]
        print("生成CSR命令：", " ".join(gen_csr_cmd))
        subprocess.run(gen_csr_cmd, check=True)
        gen_crt_cmd = [
            "openssl", "x509", "-req", "-in", csr_path, "-CA", ca_crt_path, "-CAkey", ca_key_path,
            "-CAcreateserial", "-out", crt_path, "-days", "7300", "-sha256", "-extensions", "v3_req", "-extfile", conf_path
        ]
        print("签发域名证书命令：", " ".join(gen_crt_cmd))
        subprocess.run(gen_crt_cmd, check=True)
        if os.path.exists(csr_path):
            os.remove(csr_path)
        if os.path.exists(conf_path):
            os.remove(conf_path)
        return {"success": True, "cert_path": crt_path, "key_path": key_path, "message": "域名证书生成成功（含SAN）"}
    except Exception as e:
        return {"success": False, "message": f"生成失败: {e}"}

def list_certs():
    cert_dir = '/certs'
    certs = []
    for f in os.listdir(cert_dir):
        if f.endswith('.crt'):
            name = f[:-4]
            key_path = os.path.join(cert_dir, name + '.key')
            certs.append({
                "domain": name,
                "type": "根证书" if name == 'SSLinker' else "域名证书",
                "crt": f,
                "key": f"{name}.key" if os.path.exists(key_path) else None
            })
    # 根证书排最前，其余按域名排序
    certs = sorted(certs, key=lambda x: (x['type'] != '根证书', x['domain']))
    return {"certs": certs}

# 支持type=cert/key下载不同文件
def download_cert(domain, type):
    from fastapi.responses import FileResponse
    cert_dir = '/certs'
    if type == 'key':
        file_path = os.path.join(cert_dir, f'{domain}.key')
    else:
        file_path = os.path.join(cert_dir, f'{domain}.crt')
    if not os.path.exists(file_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(file_path, filename=os.path.basename(file_path), media_type='application/octet-stream')

def delete_cert(domain):
    cert_dir = '/certs'
    crt_path = os.path.join(cert_dir, f'{domain}.crt')
    key_path = os.path.join(cert_dir, f'{domain}.key')
    crt_ok = True
    key_ok = True
    if os.path.exists(crt_path):
        try:
            os.remove(crt_path)
        except Exception:
            crt_ok = False
    if os.path.exists(key_path):
        try:
            os.remove(key_path)
        except Exception:
            key_ok = False
    if crt_ok and key_ok:
        return {"success": True}
    else:
        return {"success": False, "message": "部分或全部文件删除失败"}

def clear_all_certs():
    cert_dir = '/certs'
    failed = []
    if not os.path.exists(cert_dir):
        return {"success": True, "message": "无证书可清空"}
    for f in os.listdir(cert_dir):
        if f.endswith('.crt') or f.endswith('.key') or f.endswith('.csr') or f.endswith('.srl'):
            try:
                os.remove(os.path.join(cert_dir, f))
            except Exception:
                failed.append(f)
    if not failed:
        return {"success": True}
    else:
        return {"success": False, "message": f"部分文件删除失败: {','.join(failed)}"}
