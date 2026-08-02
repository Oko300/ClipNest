import yt_dlp
import asyncio
import json
import os
import httpx
import uuid
import threading
import queue
from typing import AsyncGenerator

async def get_video_info(url: str):
    """
    Fetches video information using yt-dlp.
    """
    ydl_opts = {
        'quiet': True,
        'simulate': True,
        'dump_single_json': True,
        'socket_timeout': 30,
        "merge_output_format": "mp4",
        "prefer_free_formats": True,
        "nocheckcertificate": True,
        "retries": 5,
        "fragment_retries": 5,
        "extractor_args": {"youtube": {"player_client": ["android_vr", "tv_downgraded", "web_embedded"]}},
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract relevant information
            video_info = {
                "id": info.get("id"),
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "formats": []
            }

            # Filter and add formats
            for f in info.get("formats", []):
                if f.get("vcodec") != "none" and f.get("acodec") != "none": # Video and audio
                    video_info["formats"].append({
                        "format_id": f.get("format_id"),
                        "ext": f.get("ext"),
                        "resolution": f.get("resolution"),
                        "fps": f.get("fps"),
                        "vcodec": f.get("vcodec"),
                        "acodec": f.get("acodec"),
                        "filesize": f.get("filesize"),
                        "url": f.get("url") # This URL might be temporary or require authentication
                    })
                elif f.get("acodec") != "none": # Audio only
                    video_info["formats"].append({
                        "format_id": f.get("format_id"),
                        "ext": f.get("ext"),
                        "acodec": f.get("acodec"),
                        "filesize": f.get("filesize"),
                        "url": f.get("url")
                    })
            
            return video_info

    except yt_dlp.DownloadError as e:
        raise ValueError(f"Could not fetch video info: {e}")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred: {e}")

async def download_video_with_progress(url, quality, fmt, start_time, end_time):
    import asyncio
    import concurrent.futures
    import json
    import os
    import uuid

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
        "noprogress": False,
        "nopart": False,
        "add_metadata": False,
        "embed_metadata": False,
        "addchapters": False,
    }

    if fmt in ("mp3", "m4a", "wav") or quality.startswith("Audio"):
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
        height = quality.replace("p", "")
        ydl_opts["format"] = (
            f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]"
            f"/bestvideo[height<={height}]+bestaudio"
            f"/best[height<={height}]"
            f"/best"
        )
        ydl_opts["postprocessors"] = [
            {
                "key": "FFmpegMetadata",
                "add_metadata": False,
            }
        ]

    if start_time and end_time:
        ydl_opts["download_sections"] = [f"*{start_time}-{end_time}"]

    progress_data = {"percent": 0, "speed": "", "eta": ""}

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
            import yt_dlp
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        except Exception as e:
            download_error[0] = e
        finally:
            loop.call_soon_threadsafe(download_done.set)

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    loop.run_in_executor(executor, run_download)

    yield f"data: {json.dumps({'status': 'downloading', 'percent': '0%'})}\n\n"

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
