from fastapi import APIRouter, Query, File, UploadFile, Form
from pydantic import BaseModel
from typing import List
from backend.services.cert_service import generate_ca_cert, generate_domain_cert, list_certs, download_cert, delete_cert, upload_cert

router = APIRouter()

@router.post("/ca")
def create_ca():
    return generate_ca_cert()

@router.post("/domain")
def create_domain_cert(domain: str, ip: str = None):
    return generate_domain_cert(domain, ip)

@router.get("/list")
def get_cert_list():
    return list_certs()

@router.get("/download")
def download(domain: str = Query(...), type: str = Query(...)):
    return download_cert(domain, type)

@router.delete("/delete")
def delete(domain: str = Query(...)):
    return delete_cert(domain)

@router.post("/upload")
async def upload_cert_api(file: UploadFile = File(...), key: UploadFile = File(...), name: str = Form(None)):
    from backend.services.cert_service import upload_cert
    return await upload_cert(file, key, name)

# 批量删除接口，支持POST /api/cert/delete，接收JSON: {"domains": ["domain1", "domain2"]}
class DomainsModel(BaseModel):
    domains: List[str]

@router.post("/delete")
def delete_certs_batch(body: DomainsModel):
    results = []
    for domain in body.domains:
        result = delete_cert(domain)
        results.append(result)
    success = all(r.get("success") for r in results)
    return {"success": success, "results": results}
