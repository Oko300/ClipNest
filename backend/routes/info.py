import ipaddress
from urllib.parse import urlparse
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dependencies import limiter
from services.downloader import get_video_info
import ipaddress
from urllib.parse import urlparse

router = APIRouter()

def is_safe_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        host = parsed.hostname
        if not host:
            return False
        blocked_hosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"]
        if host.lower() in blocked_hosts:
            return False
        try:
            ip = ipaddress.ip_address(host)
            if (ip.is_private or ip.is_loopback or
                ip.is_link_local or ip.is_reserved):
                return False
        except ValueError:
            pass  # host is a domain name, not an IP — that is fine
        return True
    except Exception:
        return False

def build_formats(info: dict) -> list:
    formats = []
    seen_qualities = set()

    raw_formats = info.get("formats", [])

    # Video formats — pick best per resolution
    for f in reversed(raw_formats):
        height = f.get("height")
        ext = f.get("ext", "mp4")
        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")
        filesize = f.get("filesize") or f.get("filesize_approx") or 0

        if not height or vcodec == "none":
            continue

        label = f"{height}p"
        if label in seen_qualities:
            continue
        seen_qualities.add(label)

        filesize_mb = round(filesize / (1024 * 1024), 1) if filesize else None

        formats.append({
            "quality": label,
            "ext": "mp4",
            "filesize_mb": filesize_mb,
            "format_id": f.get("format_id"),
        })

    # Sort by resolution descending
    formats.sort(key=lambda x: int(x["quality"].replace("p", "")), reverse=True)

    # Cap at best 5 video options
    formats = formats[:5]

    # Always add Audio options at the end
    formats.append({
        "quality": "Audio — MP3",
        "ext": "mp3",
        "filesize_mb": None,
        "format_id": "bestaudio",
    })
    formats.append({
        "quality": "Audio — M4A",
        "ext": "m4a",
        "filesize_mb": None,
        "format_id": "bestaudio",
    })
    formats.append({
        "quality": "Audio — WAV",
        "ext": "wav",
        "filesize_mb": None,
        "format_id": "bestaudio",
    })

    return formats

class InfoRequest(BaseModel):
    url: str

@router.post("/")
@limiter.limit("10/minute")
async def get_info(request: Request, body: InfoRequest):
    youtube_patterns = [
        "youtube.com", "youtu.be", "m.youtube.com",
        "youtube-nocookie.com"
    ]
    if any(p in body.url.lower() for p in youtube_patterns):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=400,
            content={"error": "YouTube is currently unavailable on ClipNest."}
        )
    if not is_safe_url(body.url):
        raise HTTPException(status_code=400, detail="Invalid or blocked URL.")
    try:
        video_info = await get_video_info(body.url)
        return video_info
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception:
        return JSONResponse(status_code=500, content={"error": "Something went wrong. Please check the link and try again."})
