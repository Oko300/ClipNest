import os
import logging
import re
import subprocess
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
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


for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
    logging.getLogger(logger_name).addFilter(PrivacyFilter())

app = FastAPI()
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3003,https://clip-nest-ten.vercel.app,https://clipnest.vercel.app,https://clipnest-backend-mrtq.onrender.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests. Please wait a minute and try again."}
    )


@app.on_event("startup")
async def upgrade_yt_dlp():
    """
    Upgrade yt-dlp to the latest version on every cold-start.
    TikTok, Instagram and other platforms update their APIs frequently;
    an outdated yt-dlp is the #1 cause of 'Unexpected response' errors.
    This runs in a background thread so it never blocks request handling.
    """
    def _upgrade():
        try:
            result = subprocess.run(
                ["pip", "install", "--upgrade", "yt-dlp", "--quiet", "--no-cache-dir"],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode == 0:
                # Log the installed version for debugging
                ver = subprocess.run(
                    ["python", "-c", "import yt_dlp; print(yt_dlp.version.__version__)"],
                    capture_output=True, text=True, timeout=10
                )
                print(f"[startup] yt-dlp ready — version {ver.stdout.strip()}")
            else:
                print(f"[startup] yt-dlp upgrade warning: {result.stderr[:200]}")
        except Exception as e:
            print(f"[startup] yt-dlp upgrade skipped: {e}")

    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, _upgrade)


@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "ok"}


app.include_router(info.router, prefix="/api/info", tags=["info"])
app.include_router(download_router, prefix="/api/download", tags=["download"])
