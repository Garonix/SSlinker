from fastapi import APIRouter, Query
from services.cert_service import generate_ca_cert, generate_domain_cert, list_certs, download_cert, delete_cert, clear_all_certs

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

@router.delete("/clear")
def clear():
    return clear_all_certs()
