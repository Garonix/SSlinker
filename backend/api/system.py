from fastapi import APIRouter
from backend.services.system_service import get_status, get_logs

router = APIRouter()

@router.get("/status")
def status():
    return get_status()

@router.get("/logs")
def logs():
    return get_logs()
