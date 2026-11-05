import yt_dlp
import asyncio
import json
import os
import uuid
import base64
import concurrent.futures

# Up-to-date browser headers — improves compatibility with TikTok, Instagram,
# Twitter/X, Facebook, Reddit and other platforms that inspect UA / Sec-* headers.
COMMON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not.A/Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
}

# Mobile user-agent — used as a fallback for TikTok / Instagram when the
# desktop UA triggers bot-detection on the first attempt.
MOBILE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}

COOKIES_PATH = "/tmp/yt_cookies.txt"


def setup_cookies():
    b64 = os.environ.get("YOUTUBE_COOKIES_B64", "")
    if not b64:
        return
    try:
        decoded = base64.b64decode(b64).decode("utf-8")
        with open(COOKIES_PATH, "w", encoding="utf-8") as f:
            f.write(decoded)
    except Exception as e:
        print(f"Failed to write cookies: {e}")


def get_cookies_opts():
    setup_cookies()
    if os.path.exists(COOKIES_PATH):
        return {"cookiefile": COOKIES_PATH}
    return {}


def sanitize_error(raw: str) -> str:
    """Convert raw yt-dlp error strings into short, user-friendly messages."""
    msg = raw.lower()
    if "login" in msg or "sign in" in msg or "authentication" in msg or "log in" in msg:
        return "This content requires login. Try a public video instead."
    if "private" in msg:
        return "This video is private and cannot be downloaded."
    if "not exist" in msg or "removed" in msg or "deleted" in msg or "no video" in msg or "404" in msg:
        return "This video no longer exists or has been removed."
    if "geo" in msg or "not available in your country" in msg or "region" in msg:
        return "This video is not available in your region."
    if "playlist" in msg and "not" not in msg and "max" not in msg:
        return "Playlist URLs are not supported. Please paste a single video link."
    if "unsupported url" in msg or "no suitable" in msg:
        return "This link is not supported. Try TikTok, Instagram, Twitter, Facebook or Vimeo."
    if "rate" in msg or "too many" in msg or "throttl" in msg:
        return "The platform is rate-limiting downloads. Please wait a moment and try again."
    if "timeout" in msg or "timed out" in msg:
        return "Connection timed out. Please try again."
    if "unexpected response" in msg or "webpage request" in msg:
        return "Platform returned an unexpected response — the server is updating. Please try again in 30 seconds."
    if "403" in msg or "forbidden" in msg:
        return "Access denied by the platform. Try a different video or wait a few minutes."
    if "status code 0" in msg or "video not available" in msg:
        return "Could not reach the platform. Please try again in a moment."
    if "requested format is not available" in msg or "format is not available" in msg:
        return "That quality is not available. Try a different quality or Audio only."
    if "no video formats" in msg or "no formats" in msg:
        return "No downloadable formats found for this video."
    # Last resort: return a shortened version of the real error so we can diagnose
    short = raw.strip().split("\n")[0][:180]
    return short if short else "Download failed. Please try again."


def _detect_platform(url: str) -> str:
    u = url.lower()
    if "tiktok.com" in u:
        return "tiktok"
    if "instagram.com" in u:
        return "instagram"
    if "twitter.com" in u or "x.com" in u:
        return "twitter"
    if "facebook.com" in u or "fb.watch" in u:
        return "facebook"
    if "reddit.com" in u or "redd.it" in u:
        return "reddit"
    return "generic"


def _base_info_opts(headers: dict) -> dict:
    return {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "noplaylist": True,
        "playlistend": 1,
        "socket_timeout": 15,
        "retries": 3,
        "fragment_retries": 3,
        "nocheckcertificate": True,
        "http_headers": headers,
        **get_cookies_opts(),
    }


async def get_video_info(url: str):
    platform = _detect_platform(url)

    # Attempt 1: standard desktop headers (works for most platforms)
    # Attempt 2 (TikTok / Instagram only): mobile UA fallback
    attempts = [
        _base_info_opts(COMMON_HEADERS),
    ]
    if platform in ("tiktok", "instagram"):
        attempts.append(_base_info_opts(MOBILE_HEADERS))

    last_error: Exception = Exception("Unknown error")

    for opts in attempts:
        try:
            loop = asyncio.get_event_loop()

            def _extract(ydl_opts=opts):
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    return ydl.extract_info(url, download=False)

            info = await loop.run_in_executor(None, _extract)

            from routes.info import build_formats
            return {
                "id": info.get("id"),
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "uploader": info.get("uploader") or info.get("channel"),
                "upload_date": info.get("upload_date"),
                "formats": build_formats(info),
            }

        except Exception as e:
            last_error = e
            continue

    raise ValueError(sanitize_error(str(last_error)))


async def download_video_with_progress(url, quality, fmt, start_time, end_time):
    file_id = str(uuid.uuid4()).replace("-", "")
    folder = f"/tmp/{file_id}"
    os.makedirs(folder, exist_ok=True)

    # Register for 2-day cleanup
    try:
        import time
        registry_path = "/tmp/download_registry.json"
        registry = {}
        if os.path.exists(registry_path):
            with open(registry_path, "r") as f:
                registry = json.load(f)
        registry[file_id] = {"folder": folder, "created_at": time.time(), "status": "downloading"}
        with open(registry_path, "w") as f:
            json.dump(registry, f)
    except Exception:
        pass

    ydl_opts = {
        "outtmpl": f"{folder}/%(title)s.%(ext)s",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "concurrent_fragment_downloads": 2,
        "http_chunk_size": 1048576,
        "socket_timeout": 20,
        "retries": 5,
        "fragment_retries": 5,
        "skip_unavailable_fragments": False,
        "continuedl": True,
        "noprogress": True,
        "nopart": False,
        "add_metadata": False,
        "embed_metadata": False,
        "addchapters": False,
        "nocheckcertificate": True,
        "http_headers": COMMON_HEADERS,
        **get_cookies_opts(),
    }

    if fmt in ("mp3", "m4a", "wav") or (isinstance(quality, str) and quality.startswith("Audio")):
        ydl_opts["format"] = "bestaudio/best"
        codec_map = {"mp3": ("mp3", "192"), "m4a": ("m4a", "192"), "wav": ("wav", "0")}
        codec, quality_val = codec_map.get(fmt, ("mp3", "192"))
        ydl_opts["postprocessors"] = [
            {"key": "FFmpegExtractAudio", "preferredcodec": codec, "preferredquality": quality_val},
            {"key": "FFmpegMetadata", "add_metadata": False},
        ]
    else:
        height = str(quality).replace("p", "").strip()
        # Always provide a pure /best fallback. TikTok & X mostly use progressive MP4s.
        # If height is not a plain integer (e.g. "1024" from odd labels) skip the height filter.
        if height.isdigit():
            ydl_opts["format"] = (
                f"best[height<={height}][ext=mp4]/best[height<={height}]"
                f"/bestvideo[height<={height}]+bestaudio/best"
                f"/best"
            )
        else:
            ydl_opts["format"] = "best[ext=mp4]/bestvideo+bestaudio/best/best"
        ydl_opts["merge_output_format"] = "mp4"
        ydl_opts["prefer_ffmpeg"] = True
        ydl_opts["postprocessors"] = [
            {"key": "FFmpegMetadata", "add_metadata": False},
        ]

    if start_time and end_time:
        ydl_opts["download_sections"] = [f"*{start_time}-{end_time}"]

    progress_data = {"percent": "0%", "speed": "", "eta": ""}

    def progress_hook(d):
        if d["status"] == "downloading":
            progress_data["percent"] = d.get("_percent_str", "0%").strip()
            progress_data["speed"] = d.get("_speed_str", "").strip()
            progress_data["eta"] = d.get("_eta_str", "").strip()

    ydl_opts["progress_hooks"] = [progress_hook]

    download_done = asyncio.Event()
    download_error = [None]
    loop = asyncio.get_event_loop()

    def run_download():
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        except Exception as e:
            print(f"[download] ERROR for {url[:80]}: {type(e).__name__}: {e}", flush=True)
            download_error[0] = e
        finally:
            loop.call_soon_threadsafe(download_done.set)

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    loop.run_in_executor(executor, run_download)

    yield f"data: {json.dumps({'status': 'downloading', 'percent': '0%', 'speed': '', 'eta': ''})}\n\n"

    while not download_done.is_set():
        try:
            await asyncio.wait_for(asyncio.shield(download_done.wait()), timeout=2)
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'status': 'downloading', 'percent': progress_data['percent'], 'speed': progress_data['speed'], 'eta': progress_data['eta']})}\n\n"

    if download_error[0]:
        yield f"data: {json.dumps({'status': 'error', 'message': sanitize_error(str(download_error[0]))})}\n\n"
        return

    yield f"data: {json.dumps({'status': 'processing', 'percent': '99%', 'speed': 'Processing\u2026', 'eta': ''})}\n\n"

    found_file = found_path = None
    if os.path.exists(folder):
        for fname in os.listdir(folder):
            if fname.endswith(".part") or fname.endswith(".ytdl"):
                continue
            found_file = fname
            found_path = os.path.join(folder, fname)
            break

    if found_path:
        yield f"data: {json.dumps({'status': 'done', 'file_id': file_id, 'filename': found_file})}\n\n"
    else:
        yield f"data: {json.dumps({'status': 'error', 'message': 'Download failed: output file not found. Please try again.'})}\n\n"
