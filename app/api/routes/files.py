# app/api/routes/files.py
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

#Configuración por tipo 

IMAGE_MIME_TYPES = {
    "image/png":     "png",
    "image/jpeg":    "jpg",
    "image/svg+xml": "svg",
    "image/webp":    "webp",
    "image/gif":     "gif",
}
IMAGE_MAX_BYTES = 2 * 1024 * 1024          # 2MB

DOCUMENT_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}
DOCUMENT_MAX_BYTES = 10 * 1024 * 1024      # 10MB

MEDIA_MIME_TYPES = {
    "video/mp4":  "mp4",
    "video/webm": "webm",
}
MEDIA_MAX_BYTES = 50 * 1024 * 1024         # 50MB


# Helper

async def save_upload(
    file: UploadFile,
    allowed_types: dict,
    max_bytes: int,
    type_label: str,
) -> dict:
    if file.content_type not in allowed_types:
        allowed = ", ".join(allowed_types.keys())
        raise HTTPException(
            status_code=415,
            detail=f"Tipo no permitido: {file.content_type}. Permitidos: {allowed}"
        )

    content = await file.read()
    if len(content) > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"El archivo excede el límite de {mb}MB para {type_label}."
        )

    ext = allowed_types[file.content_type]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as f:
        f.write(content)

    return {
        "filename": filename,
        "path": f"/uploads/{filename}",
        "content_type": file.content_type,
        "size_bytes": len(content),
    }


# Endpoints 

@router.post("/upload/image", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Sube una imagen. Formatos: png, jpg, svg, webp, gif. Máximo 2MB."""
    return await save_upload(file, IMAGE_MIME_TYPES, IMAGE_MAX_BYTES, "imágenes")


@router.post("/upload/document", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Sube un documento. Formatos: pdf, docx. Máximo 10MB."""
    return await save_upload(file, DOCUMENT_MIME_TYPES, DOCUMENT_MAX_BYTES, "documentos")


@router.post("/upload/media", status_code=201)
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Sube un archivo de video. Formatos: mp4, webm. Máximo 50MB."""
    return await save_upload(file, MEDIA_MIME_TYPES, MEDIA_MAX_BYTES, "media")
