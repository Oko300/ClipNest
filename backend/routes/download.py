from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
import asyncio
import os
import aiofiles
import json
from dependencies import limiter
from services.downloader import download_video_with_progress

router = APIRouter()

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
    
    async def cleanup():
        await asyncio.sleep(30)
        if os.path.exists(path):
            os.remove(path)
        if os.path.exists(folder):
            os.rmdir(folder)
    
    asyncio.create_task(cleanup())
    return FileResponse(path, media_type="application/octet-stream", filename=filename)
