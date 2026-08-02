import os
import logging
import re
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from routes import info
from routes.download import router as download_router # Ensure this is also absolute
from dependencies import limiter # Import limiter from the new dependencies file

class PrivacyFilter(logging.Filter):
    def filter(self, record):
        msg = str(record.getMessage())
        # Strip IP addresses
        msg = re.sub(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '[IP HIDDEN]', msg)
        # Strip user-agent strings
        msg = re.sub(r'(user-agent[:\s]+)[^\s"]+', r'\1[HIDDEN]', msg, flags=re.IGNORECASE)
        record.msg = msg
        record.args = ()
        return True

# Apply filter to uvicorn loggers
for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
    logging.getLogger(logger_name).addFilter(PrivacyFilter())

app = FastAPI()
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Suppress default uvicorn access log
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

# CORS Middleware
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3003,https://clipnest.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limit Exception Handler
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests. Please wait a minute and try again."}
    )

# Health Check Endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Include Routers
app.include_router(info.router, prefix="/api/info", tags=["info"])

from routes.download import router as download_router
app.include_router(download_router, prefix="/api/download", tags=["download"])
