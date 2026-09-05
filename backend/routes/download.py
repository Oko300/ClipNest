from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
import asyncio
import os
import time
import aiofiles
import json
from pathlib import Path
from dependencies import limiter
from services.downloader import download_video_with_progress

router = APIRouter()

DOWNLOAD_REGISTRY = "/tmp/download_registry.json"

def load_registry() -> dict:
    try:
        if os.path.exists(DOWNLOAD_REGISTRY):
            with open(DOWNLOAD_REGISTRY, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_registry(registry: dict):
    try:
        with open(DOWNLOAD_REGISTRY, "w") as f:
            json.dump(registry, f)
    except Exception:
        pass

def cleanup_expired_downloads():
    """Delete downloads older than 2 days."""
    registry = load_registry()
    now = time.time()
    two_days = 60 * 60 * 48
    to_delete = []
    for file_id, entry in registry.items():
        if now - entry.get("created_at", 0) > two_days:
            folder = f"/tmp/{file_id}"
            try:
                import shutil
                if os.path.exists(folder):
                    shutil.rmtree(folder)
            except Exception:
                pass
            to_delete.append(file_id)
    for file_id in to_delete:
        del registry[file_id]
    save_registry(registry)

@router.get("/stream")
@limiter.limit("5/minute")
async def stream_download(
    request: Request,
    url: str,
    quality: str = "720p",
    format_type: str = "mp4",
    start_time: str = None,
    end_time: str = None
):
    return StreamingResponse(
        download_video_with_progress(url, quality, format_type, start_time, end_time),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@router.get("/file/{file_id}")
async def get_downloaded_file(file_id: str):
    if "/" in file_id or ".." in file_id:
        return JSONResponse(status_code=400, content={"error": "Invalid file ID"})

    folder = f"/tmp/{file_id}"
    if not os.path.exists(folder):
        return JSONResponse(status_code=404, content={"error": "File not found or already deleted"})
    
    files = os.listdir(folder)
    if not files:
        return JSONResponse(status_code=404, content={"error": "File not found or already deleted"})
    
    filename = files[0]
    path = os.path.join(folder, filename)

    # Register this download in the 2-day registry
    registry = load_registry()
    registry[file_id] = {
        "path": str(path),
        "folder": str(folder),
        "filename": filename,
        "created_at": time.time(),
    }
    save_registry(registry)

    # Clean up any expired downloads while we're here
    cleanup_expired_downloads()

    return FileResponse(path, media_type="application/octet-stream", filename=filename)
