import os
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from app.core.config import settings
from app.api.v1.endpoints.auth import get_current_admin

router = APIRouter()

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _is_supported_image(head: bytes) -> bool:
    """Magic-byte sniff for the formats we accept."""
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    if head.startswith(b"\xff\xd8\xff"):  # JPEG
        return True
    if head.startswith(b"GIF87a") or head.startswith(b"GIF89a"):
        return True
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return True
    return False


@router.post("/", dependencies=[Depends(get_current_admin)])
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{ext}' is not allowed. Supported extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MIME type '{file.content_type}' is invalid. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}"
        )

    # Ensure upload folder exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    total_bytes = 0
    first_chunk = True
    try:
        with open(file_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                if first_chunk:
                    # The extension and Content-Type both come from the client and
                    # can say anything. Check what the bytes actually are.
                    if not _is_supported_image(chunk):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="That file is not a valid PNG, JPEG, WebP or GIF image.",
                        )
                    first_chunk = False

                total_bytes += len(chunk)
                if total_bytes > MAX_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB",
                    )
                f.write(chunk)

        if total_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty."
            )
    except Exception:
        # Never leave a partial or rejected file behind.
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    public_url = f"/uploads/{unique_filename}"
    return {
        "filename": unique_filename,
        "original_name": file.filename,
        "url": public_url
    }

