"""
ClipNest backend — main entry point.

yt-dlp is upgraded synchronously at import time, before FastAPI initialises and
before uvicorn registers any routes. This guarantees the latest TikTok /
Instagram / Twitter extractor code is active for every request, regardless of
how old the Render build cache is.
"""

# ── STEP 1: keep yt-dlp current ──────────────────────────────────────────────
# This runs the moment `uvicorn main:app` imports this module — well before the
# event loop starts and before the first health-check ping arrives.
import subprocess, sys

print("[boot] Upgrading yt-dlp …", flush=True)
try:
    _res = subprocess.run(
        [sys.executable, "-m", "pip", "install", "--upgrade",
         "yt-dlp", "--quiet", "--no-cache-dir"],
        timeout=120,
        check=False,
    )
    _ver = subprocess.run(
        [sys.executable, "-c",
         "import yt_dlp; print(yt_dlp.version.__version__)"],
        capture_output=True, text=True, timeout=10,
    )
    print(f"[boot] yt-dlp ready — {_ver.stdout.strip()}", flush=True)
except Exception as _e:
    print(f"[boot] yt-dlp upgrade skipped ({_e}); using installed version.", flush=True)

# ── STEP 2: normal FastAPI setup ─────────────────────────────────────────────
import os
import logging
import re
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from routes import info
from routes.download import router as download_router
from dependencies import limiter


class PrivacyFilter(logging.Filter):
    def filter(self, record):
        msg = str(record.getMessage())
        msg = re.sub(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '[IP HIDDEN]', msg)
        msg = re.sub(r'(user-agent[:\s]+)[^\s"]+', r'\1[HIDDEN]', msg, flags=re.IGNORECASE)
        record.msg = msg
        record.args = ()
        return True


for _logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
    logging.getLogger(_logger_name).addFilter(PrivacyFilter())

app = FastAPI()
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3003,"
    "https://clip-nest-ten.vercel.app,https://clipnest.vercel.app,"
    "https://clipnest-backend-mrtq.onrender.com",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests. Please wait a minute and try again."},
    )


@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "ok"}


app.include_router(info.router, prefix="/api/info", tags=["info"])
app.include_router(download_router, prefix="/api/download", tags=["download"])
