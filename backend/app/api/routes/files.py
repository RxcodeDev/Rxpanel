# app/api/routes/files.py
import uuid
import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/svg+xml"}
MAX_SIZE_BYTES = 2 * 1024 * 1024  # 2MB

MIME_TO_EXT = {
    "image/png":     "png",
    "image/jpeg":    "jpg",
    "image/svg+xml": "svg",
}


@router.post("/upload", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    # Validar MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de archivo no permitido: {file.content_type}. Solo se aceptan png, jpeg y svg."
        )

    # Leer contenido y validar tamaño
    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo excede el tamaño máximo permitido de 2MB."
        )

    # Generar nombre único con UUID
    ext = MIME_TO_EXT[file.content_type]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename

    # Guardar archivo
    with open(filepath, "wb") as f:
        f.write(content)

    return {
        "filename": filename,
        "path": f"/uploads/{filename}",
        "content_type": file.content_type,
        "size_bytes": len(content),
    }
