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

def download_video_with_progress(url: str, quality: str, format_type: str, start_time: str = None, end_time: str = None):
    
    # Placeholder for is_safe_url function, assuming it exists elsewhere or will be added.
    # For now, we'll assume all URLs are safe.
    def is_safe_url(url_to_check: str) -> bool:
        return True

    if not is_safe_url(url):
        yield f"data: {json.dumps({'status': 'error', 'message': 'Unsafe or invalid URL'})}\n\n"
        return
    
    file_id = uuid.uuid4().hex
    output_template = f"/tmp/{file_id}/%(title)s.%(ext)s"
    events_queue = queue.Queue()
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'outtmpl': output_template,
        'nocheckcertificate': True,
        'retries': 3,
        'fragment_retries': 3,
        'skip_unavailable_fragments': True,
        'socket_timeout': 30,
        'concurrent_fragment_downloads': 4,
        'http_chunk_size': 10485760,
        'prefer_free_formats': True,
        'merge_output_format': 'mp4', # Added for ffmpeg-free merging
        'add_metadata': False,
        'embed_metadata': False,
        'addchapters': False,
        'continuedl': True, # Enable download resumption
        'noprogress': False, # Show progress bar
        'nopart': False, # Do not remove .part files
        'postprocessors': [
            {
                'key': 'FFmpegMetadata',
                'add_metadata': False,
            }
        ],
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        'extractor_args': {"youtube": {"player_client": ["android_vr", "tv_downgraded", "web_embedded"]}},
        "merge_output_format": "mp4",
        "prefer_free_formats": True,
        "nocheckcertificate": True,
        "retries": 5,
        "fragment_retries": 5,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    }
    
    if format_type == "mp3":
        ydl_opts["format"] = "bestaudio/best"
        # Remove merge_output_format for audio extraction
        if "merge_output_format" in ydl_opts:
            del ydl_opts["merge_output_format"]
        codec_map = {
            "mp3": ("mp3", "192"),
            "m4a": ("m4a", "192"),
            "wav": ("wav", "0"),
        }
        codec, quality_val = codec_map.get(format_type, ("mp3", "192"))
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
        if quality == "1080p":
            ydl_opts["format"] = "best[height<=1080][ext=mp4]/best[height<=1080]/best"
        elif quality == "720p":
            ydl_opts["format"] = "best[height<=720][ext=mp4]/best[height<=720]/best"
        elif quality == "480p":
            ydl_opts["format"] = "best[height<=480][ext=mp4]/best[height<=480]/best"
        elif quality == "360p":
            ydl_opts["format"] = "best[height<=360][ext=mp4]/best[height<=360]/best"
        else:
            ydl_opts["format"] = "best[ext=mp4]/best"
        ydl_opts['postprocessors'] = [
            {
                'key': 'FFmpegMetadata',
                'add_metadata': False,
            }
        ]
    
    if start_time and end_time:
        ydl_opts['download_sections'] = [f"*{start_time}-{end_time}"]
        ydl_opts['force_keyframes_at_cuts'] = True
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            percent_str = d.get('_percent_str', '0%').strip().replace('%', '').replace('\x1b[0;94m', '').replace('\x1b[0m', '').strip()
            try:
                percent = float(percent_str)
            except:
                percent = 0
            speed = d.get('_speed_str', 'N/A').strip()
            eta = d.get('_eta_str', 'N/A').strip()
            events_queue.put({'status': 'downloading', 'percent': percent, 'speed': speed, 'eta': eta})
        elif d['status'] == 'finished':
            events_queue.put({'status': 'processing'})
    
    ydl_opts['progress_hooks'] = [progress_hook]
    
    loop = asyncio.get_event_loop()
    download_done = asyncio.Event()
    download_error = [None]

    def run_download_sync():
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        except Exception as e:
            download_error[0] = e
        finally:
            loop.call_soon_threadsafe(download_done.set)

    import concurrent.futures
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    future = loop.run_in_executor(executor, run_download_sync)

    while not download_done.is_set():
        try:
            await asyncio.wait_for(
                asyncio.shield(download_done.wait()),
                timeout=15
            )
        except asyncio.TimeoutError:
            yield ": heartbeat\n\n"

    await future

    if download_error[0]:
        raise download_error[0]

    # Original progress hook handling
    while True:
        try:
            event = events_queue.get(timeout=1)
            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"
        except:
            if not future.done(): # Check if the async task is still running
                continue
            else:
                break # If task is done and queue is empty, break

    if download_error[0]: # Re-raise if there was an error during download
        yield f"data: {json.dumps({'status': 'error', 'message': str(download_error[0])})}\n\n"
        return
    
    found_file = None
    found_path = None
    folder = f"/tmp/{file_id}"
    if os.path.exists(folder):
        for fname in os.listdir(folder):
            found_file = fname
            found_path = os.path.join(folder, fname)
            break
    
    if found_path:
        yield f"data: {json.dumps({'status': 'done', 'file_id': file_id, 'filename': found_file})}\n\n"
    else:
        yield f"data: {json.dumps({'status': 'error', 'message': 'Download failed: output file not found'})}\n\n"
