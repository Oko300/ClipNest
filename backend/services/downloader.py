import yt_dlp
import asyncio
import json
import os
import uuid
import base64
import concurrent.futures

COMMON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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


async def get_video_info(url: str):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'socket_timeout': 30,
        'retries': 5,
        'fragment_retries': 5,
        'nocheckcertificate': True,
        'http_headers': COMMON_HEADERS,
        **get_cookies_opts(),
        'extractor_args': {
            'youtube': {
                'player_client': ['android_vr', 'tv_embedded', 'web_embedded', 'mweb']
            }
        },
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
        raise ValueError(f"Could not fetch video info: {e}")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred: {e}")


async def download_video_with_progress(url, quality, fmt, start_time, end_time):
    file_id = str(uuid.uuid4()).replace("-", "")
    folder = f"/tmp/{file_id}"
    os.makedirs(folder, exist_ok=True)

    ydl_opts = {
        "outtmpl": f"{folder}/%(title)s.%(ext)s",
        "quiet": True,
        "no_warnings": True,
        "concurrent_fragment_downloads": 4,
        "http_chunk_size": 10485760,
        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,
        "skip_unavailable_fragments": True,
        "continuedl": True,
        "noprogress": True,
        "nopart": False,
        "add_metadata": False,
        "embed_metadata": False,
        "addchapters": False,
        "nocheckcertificate": True,
        "http_headers": COMMON_HEADERS,
        **get_cookies_opts(),
        'extractor_args': {
            'youtube': {
                'player_client': ['android_vr', 'tv_embedded', 'web_embedded', 'mweb']
            }
        },
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
            f"bestvideo[height<={height}]+bestaudio"
            f"/best[height<={height}]"
            f"/best"
        )
        ydl_opts["merge_output_format"] = "mp4"
        ydl_opts["postprocessors"] = [
            {
                "key": "FFmpegMetadata",
                "add_metadata": False,
            }
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
            download_error[0] = e
        finally:
            loop.call_soon_threadsafe(download_done.set)

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    loop.run_in_executor(executor, run_download)

    yield f"data: {json.dumps({'status': 'downloading', 'percent': '0%', 'speed': '', 'eta': ''})}\n\n"

    while not download_done.is_set():
        try:
            await asyncio.wait_for(
                asyncio.shield(download_done.wait()),
                timeout=15,
            )
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'status': 'downloading', 'percent': progress_data['percent'], 'speed': progress_data['speed'], 'eta': progress_data['eta']})}\n\n"

    if download_error[0]:
        yield f"data: {json.dumps({'status': 'error', 'message': str(download_error[0])})}\n\n"
        return

    found_file = None
    found_path = None
    if os.path.exists(folder):
        for fname in os.listdir(folder):
            found_file = fname
            found_path = os.path.join(folder, fname)
            break

    if found_path:
        yield f"data: {json.dumps({'status': 'done', 'file_id': file_id, 'filename': found_file})}\n\n"
    else:
        yield f"data: {json.dumps({'status': 'error', 'message': 'Download failed: output file not found'})}\n\n"
