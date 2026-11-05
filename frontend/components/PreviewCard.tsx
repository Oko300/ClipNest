"use client"
import { useState } from "react"

/** Format raw seconds (e.g. 183) → "3:03" or "1:02:03" */
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || isNaN(seconds)) return ""
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${m}:${String(s).padStart(2, "0")}`
}

/** Format yt-dlp upload_date "YYYYMMDD" → "Jan 15, 2024" */
function formatDate(d: string | null | undefined): string {
  if (!d || d.length !== 8) return d || ""
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const year = d.slice(0, 4)
  const month = parseInt(d.slice(4, 6), 10)
  const day = parseInt(d.slice(6, 8), 10)
  if (month < 1 || month > 12) return d
  return `${months[month - 1]} ${day}, ${year}`
}

export default function PreviewCard({ videoInfo }: { videoInfo: any }) {
  const [imgError, setImgError] = useState(false)

  const duration = formatDuration(videoInfo.duration)
  const date = formatDate(videoInfo.upload_date)
  // Backend key is "uploader" (yt-dlp field); fall back to "channel" if present
  const uploader = videoInfo.uploader || videoInfo.channel || ""

  return (
    <div className="flex gap-4 p-4 border-b border-[#1f1f1f]">
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 w-28 rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#1f1f1f]"
        style={{ height: "72px" }}
      >
        {!imgError ? (
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#3f3f46] text-xs">
            No preview
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0 flex-1 justify-center">
        <h3 className="text-[#f5f5f5] font-semibold text-sm leading-snug line-clamp-2">
          {videoInfo.title}
        </h3>

        {uploader && (
          <p className="text-[#6366f1] text-xs font-medium truncate">{uploader}</p>
        )}

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {duration && (
            <span className="text-[#52525b] text-xs">⏱ {duration}</span>
          )}
          {date && (
            <span className="text-[#52525b] text-xs">📅 {date}</span>
          )}
        </div>
      </div>
    </div>
  )
}
