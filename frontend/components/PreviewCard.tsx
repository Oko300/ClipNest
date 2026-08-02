"use client"
import { useState } from "react"

export default function PreviewCard({ videoInfo }: { videoInfo: any }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="flex gap-4 p-4 border-b border-[#1f1f1f]">
      <div className="flex-shrink-0 w-28 h-18 rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#1f1f1f]" style={{height: "72px"}}>
        {!imgError ? (
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#3f3f46] text-xs">No preview</div>
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1 justify-center">
        <h3 className="text-[#f5f5f5] font-semibold text-sm leading-snug line-clamp-2">{videoInfo.title}</h3>
        <p className="text-[#6366f1] text-xs font-medium">{videoInfo.channel}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[#52525b] text-xs">⏱ {videoInfo.duration}</span>
          <span className="text-[#52525b] text-xs">📅 {videoInfo.upload_date}</span>
        </div>
      </div>
    </div>
  )
}