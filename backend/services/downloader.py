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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
}

COOKIES_PATH = "/tmp/yt_cookies.txt"


def setup_cookies():
    """Always rewrite cookies from environment variable on every call."""
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
    """Write cookies and return cookiefile option."""
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
    if "max downloads" in msg or "playlist" in msg:
        return "Playlist URLs are not supported. Please paste a single video link."
    if "unsupported url" in msg or "no suitable" in msg or "extractor" in msg:
        return "This link is not supported. Try TikTok, Instagram, Twitter, Facebook or Vimeo."
    if "rate" in msg or "too many" in msg or "throttl" in msg:
        return "The platform is rate-limiting downloads. Please wait a moment and try again."
    if "timeout" in msg or "timed out" in msg:
        return "Connection timed out. Please try again."
    return "Download failed. Please check the link and try again."


async def get_video_info(url: str):
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        # Prevent accidentally fetching an entire playlist
        "noplaylist": True,
        "playlistend": 1,
        "socket_timeout": 15,
        "retries": 3,
        "fragment_retries": 3,
        "nocheckcertificate": True,
        "http_headers": COMMON_HEADERS,
        **get_cookies_opts(),
    }
    try:
        loop = asyncio.get_event_loop()

        def _extract():
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

    except yt_dlp.utils.DownloadError as e:
        raise ValueError(sanitize_error(str(e)))
    except Exception as e:
        raise ValueError(sanitize_error(str(e)))


async def download_video_with_progress(url, quality, fmt, start_time, end_time):
    file_id = str(uuid.uuid4()).replace("-", "")
    folder = f"/tmp/{file_id}"
    os.makedirs(folder, exist_ok=True)

    # Register download start time for 2-day retention
    try:
        import time
        registry_path = "/tmp/download_registry.json"
        registry = {}
        if os.path.exists(registry_path):
            with open(registry_path, "r") as f:
                registry = json.load(f)
        registry[file_id] = {
            "folder": folder,
            "created_at": time.time(),
            "status": "downloading",
        }
        with open(registry_path, "w") as f:
            json.dump(registry, f)
    except Exception:
        pass

    ydl_opts = {
        "outtmpl": f"{folder}/%(title)s.%(ext)s",
        "quiet": True,
        "no_warnings": True,
        # Safety: never try to download an entire playlist
        "noplaylist": True,
        "max_downloads": 1,
        # 2 concurrent fragments: fast enough but won't trigger platform rate-limits
        "concurrent_fragment_downloads": 2,
        # 1 MB chunks — more reliable across platforms than the previous 10 MB
        "http_chunk_size": 1048576,
        "socket_timeout": 20,
        "retries": 5,
        "fragment_retries": 5,
        # False: don't silently produce broken/incomplete files
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
        codec_map = {
            "mp3": ("mp3", "192"),
            "m4a": ("m4a", "192"),
            "wav": ("wav", "0"),
        }
        codec, quality_val = codec_map.get(fmt, ("mp3", "192"))
        ydl_opts["postprocessors"] = [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": codec,
                "preferredquality": quality_val,
            },
            {
                "key": "FFmpegMetadata",
                "add_metadata": False,
            },
        ]
    else:
        height = str(quality).replace("p", "")
        ydl_opts["format"] = (
            f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]"
            f"/bestvideo[height<={height}][ext=mp4]+bestaudio"
            f"/bestvideo[height<={height}]+bestaudio[ext=m4a]"
            f"/bestvideo[height<={height}]+bestaudio"
            f"/best[height<={height}][ext=mp4]"
            f"/best[height<={height}]"
            f"/best"
        )
        ydl_opts["merge_output_format"] = "mp4"
        ydl_opts["prefer_ffmpeg"] = True
        ydl_opts["postprocessors"] = [
            {
                "key": "FFmpegVideoConvertor",
                "preferedformat": "mp4",
            },
            {
                "key": "FFmpegMetadata",
                "add_metadata": False,
            },
        ]
        # Re-encode audio to AAC so opus/webm streams are playable inside mp4.
        ydl_opts["postprocessor_args"] = {
            "ffmpeg": ["-c:a", "aac", "-b:a", "192k"]
        }

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
            download_error[0] = e
        finally:
            loop.call_soon_threadsafe(download_done.set)

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    loop.run_in_executor(executor, run_download)

    yield f"data: {json.dumps({'status': 'downloading', 'percent': '0%', 'speed': '', 'eta': ''})}\n\n"

    # Poll every 2 seconds (was 15s — users now see near-real-time progress)
    while not download_done.is_set():
        try:
            await asyncio.wait_for(
                asyncio.shield(download_done.wait()),
                timeout=2,
            )
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'status': 'downloading', 'percent': progress_data['percent'], 'speed': progress_data['speed'], 'eta': progress_data['eta']})}\n\n"

    if download_error[0]:
        yield f"data: {json.dumps({'status': 'error', 'message': sanitize_error(str(download_error[0]))})}\n\n"
        return

    # Signal FFmpeg post-processing phase so the UI can show "Processing…"
    yield f"data: {json.dumps({'status': 'processing', 'percent': '99%', 'speed': 'Processing\u2026', 'eta': ''})}\n\n"

    found_file = None
    found_path = None
    if os.path.exists(folder):
        for fname in os.listdir(folder):
            # Skip yt-dlp temp files that weren't cleaned up
            if fname.endswith(".part") or fname.endswith(".ytdl"):
                continue
            found_file = fname
            found_path = os.path.join(folder, fname)
            break

    if found_path:
        yield f"data: {json.dumps({'status': 'done', 'file_id': file_id, 'filename': found_file})}\n\n"
    else:
        yield f"data: {json.dumps({'status': 'error', 'message': 'Download failed: output file not found. Please try again.'})}\n\n"
