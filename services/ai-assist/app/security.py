import secrets
from fastapi import Header, HTTPException
from .settings import settings

async def require_service_key(x_ai_service_key: str = Header(default="")):
    if len(settings.service_key) < 32:
        raise HTTPException(503, "AI service is not configured")
    if not secrets.compare_digest(x_ai_service_key, settings.service_key):
        raise HTTPException(401, "Invalid service credential")
