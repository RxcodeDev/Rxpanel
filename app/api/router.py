# app/api/router.py
from fastapi import APIRouter
from app.api.routes import health, auth, users, sites, proxy, files, history

router = APIRouter()
router.include_router(health.router)
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(sites.router)
router.include_router(proxy.router)
router.include_router(files.router)
router.include_router(history.router)
