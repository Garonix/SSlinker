import os
import subprocess

def generate_ca_cert():
    ca_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../certs'))
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
    cert_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../certs'))
    os.makedirs(cert_dir, exist_ok=True)
    key_path = os.path.join(cert_dir, f'{domain}.key')
    csr_path = os.path.join(cert_dir, f'{domain}.csr')
    crt_path = os.path.join(cert_dir, f'{domain}.crt')
    ca_key_path = os.path.join(cert_dir, 'SSLinker.key')
    ca_crt_path = os.path.join(cert_dir, 'SSLinker.crt')
    if not os.path.exists(ca_key_path) or not os.path.exists(ca_crt_path):
        return {"success": False, "message": "请先生成CA根证书"}
    try:
        # 1. 生成域名私钥
        gen_key_cmd = ["openssl", "genrsa", "-out", key_path, "2048"]
        print("生成域名私钥命令：", " ".join(gen_key_cmd))
        subprocess.run(gen_key_cmd, check=True)
        # 2. 生成CSR
        subj = f"/CN={domain}"
        if ip:
            subj += f"/IP={ip}"
        gen_csr_cmd = ["openssl", "req", "-new", "-key", key_path, "-out", csr_path, "-subj", subj]
        print("生成CSR命令：", " ".join(gen_csr_cmd))
        subprocess.run(gen_csr_cmd, check=True)
        # 3. 生成证书（签名）
        gen_crt_cmd = [
            "openssl", "x509", "-req", "-in", csr_path, "-CA", ca_crt_path, "-CAkey", ca_key_path,
            "-CAcreateserial", "-out", crt_path, "-days", "7300", "-sha256"
        ]
        print("签发域名证书命令：", " ".join(gen_crt_cmd))
        subprocess.run(gen_crt_cmd, check=True)
        # 删除csr文件（可选）
        if os.path.exists(csr_path):
            os.remove(csr_path)
        return {"success": True, "cert_path": crt_path, "key_path": key_path, "message": "域名证书生成成功"}
    except Exception as e:
        return {"success": False, "message": f"生成失败: {e}"}

def list_certs():
    cert_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../certs'))
    certs = []
    for f in os.listdir(cert_dir):
        if f.endswith('.crt'):
            name = f.replace('.crt', '')
            certs.append({
                "name": name,
                "domain": name,
                "cert_path": os.path.join(cert_dir, f),
                "key_path": os.path.join(cert_dir, name + '.key')
            })
    return {"certs": certs}

def download_cert(domain, type):
    from fastapi.responses import FileResponse
    cert_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../certs'))
    file_path = os.path.join(cert_dir, f'{domain}.crt')
    if not os.path.exists(file_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(file_path, filename=os.path.basename(file_path), media_type='application/octet-stream')

def delete_cert(domain):
    cert_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../certs'))
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
    cert_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../certs'))
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
