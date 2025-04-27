import os
import subprocess
import shutil

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

async def upload_cert(file, key, name=None):
    upload_dir = '/certs/uploads'
    os.makedirs(upload_dir, exist_ok=True)
    # 证书
    cert_filename = file.filename
    if not (cert_filename.endswith('.crt') or cert_filename.endswith('.pem') or cert_filename.endswith('.cer')):
        return {"success": False, "message": "只允许crt/pem/cer证书文件"}
    # 证书名称（优先用name，否则用文件名去后缀）
    base_name = name.strip() if name else os.path.splitext(cert_filename)[0]
    # 文件保存名：名称+后缀
    cert_save_path = os.path.join(upload_dir, base_name + os.path.splitext(cert_filename)[1])
    # 私钥
    key_filename = key.filename
    if not key_filename.endswith('.key'):
        return {"success": False, "message": "只允许.key私钥文件"}
    key_save_path = os.path.join(upload_dir, base_name + '.key')
    try:
        with open(cert_save_path, "wb") as buffer:
            import shutil
            shutil.copyfileobj(file.file, buffer)
        with open(key_save_path, "wb") as buffer:
            import shutil
            shutil.copyfileobj(key.file, buffer)
        return {"success": True, "message": "上传成功"}
    except Exception as e:
        return {"success": False, "message": f"上传失败: {e}"}

def list_certs():
    cert_dir = '/certs'
    certs = []
    # 普通/CA证书
    for f in os.listdir(cert_dir):
        if f.endswith('.crt'):
            name = f[:-4]
            key_path = os.path.join(cert_dir, name + '.key')
            certs.append({
                "domain": name,
                "type": "根证书" if name == 'SSLinker' else "域名证书",
                "crt": f,
                "key": f"{name}.key" if os.path.exists(key_path) else None,
                "name": name  # 普通证书名称
            })
    # 其他证书（上传）
    upload_dir = os.path.join(cert_dir, 'uploads')
    if os.path.exists(upload_dir):
        for f in os.listdir(upload_dir):
            if f.endswith('.crt') or f.endswith('.pem') or f.endswith('.cer'):
                base_name = os.path.splitext(f)[0]
                key_file = os.path.join(upload_dir, base_name + '.key')
                certs.append({
                    "domain": f,
                    "type": "其他证书",
                    "crt": f,
                    "uploaded": True,
                    "path": os.path.join(upload_dir, f),
                    "key": key_file if os.path.exists(key_file) else None,
                    "name": base_name  # 展示证书名称
                })
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
    upload_dir = os.path.join(cert_dir, 'uploads')
    # 优先删普通/CA证书
    crt_path = os.path.join(cert_dir, domain + '.crt')
    key_path = os.path.join(cert_dir, domain + '.key')
    deleted = False
    if os.path.exists(crt_path):
        os.remove(crt_path)
        deleted = True
    if os.path.exists(key_path):
        os.remove(key_path)
        deleted = True
    # 如果普通目录没有，再删上传目录
    for ext in ['.crt', '.pem', '.cer']:
        up_crt_path = os.path.join(upload_dir, domain + ext)
        if os.path.exists(up_crt_path):
            os.remove(up_crt_path)
            deleted = True
    up_key_path = os.path.join(upload_dir, domain + '.key')
    if os.path.exists(up_key_path):
        os.remove(up_key_path)
        deleted = True
    if deleted:
        return {"success": True, "message": "删除成功"}
    else:
        return {"success": False, "message": "未找到对应证书"}

# 已移除clear_all_certs函数实现
