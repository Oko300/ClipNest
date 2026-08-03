"use client"
import { useState } from "react"

interface Format { quality: string; ext: string; filesize_mb: number }
interface Props {
  formats: Format[]
  selectedQuality: string
  selectedFormat: string
  startTime: string
  endTime: string
  onQualityChange: (v: string) => void
  onFormatChange: (v: string) => void
  onStartTimeChange: (v: string) => void
  onEndTimeChange: (v: string) => void
  onDownload: () => void
  downloadState: "idle" | "downloading" | "done" | "error"
}

export default function DownloadOptions({ formats, selectedQuality, selectedFormat, startTime, endTime, onQualityChange, onFormatChange, onStartTimeChange, onEndTimeChange, onDownload, downloadState }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const videoFormats = formats.filter(f => f.quality !== "Audio only")

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Format Toggle */}
      <div className="flex gap-2 p-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl">
        {[{ label: "Video (MP4)", value: "mp4" }, { label: "Audio only (MP3)", value: "mp3" }].map(opt => (
          <button
            key={opt.value}
            onClick={() => onFormatChange(opt.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors
              ${selectedFormat === opt.value ? 'bg-[#6366f1] text-white' : 'bg-transparent text-[#71717a]'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Quality Pills */}
      {selectedFormat === "mp4" && videoFormats.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[#52525b] text-[11px] font-medium uppercase tracking-wider">Quality</p>
          <div className="flex flex-wrap gap-2">
            {videoFormats.map((f) => (
              <button
                key={f.quality}
                onClick={() => onQualityChange(f.quality)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-w-[60px]
                  ${selectedQuality === f.quality ? 'bg-[#6366f1] border border-[#6366f1] text-white' : 'bg-[#1a1a1a] border border-[#333333] text-white'}`}
              >
                {f.quality}{f.filesize_mb > 0 ? ` ~${f.filesize_mb}MB` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Clip Cutter */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[#52525b] text-xs bg-none border-none cursor-pointer p-0"
        >
          <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}>&#9658;</span>
          Clip a specific portion
        </button>
        {showAdvanced && (
          <div>
            <div className="flex gap-1.5 mb-2">
              <button onClick={() => { onStartTimeChange('00:00:00'); onEndTimeChange('00:05:00'); }}
                className="px-2.5 py-1 text-[11px] rounded-md border border-[#333] bg-[#1a1a1a] text-[#a1a1aa] cursor-pointer">
                First 5 min
              </button>
              <button onClick={() => { onStartTimeChange('00:00:00'); onEndTimeChange('00:01:00'); }}
                className="px-2.5 py-1 text-[11px] rounded-md border border-[#333] bg-[#1a1a1a] text-[#a1a1aa] cursor-pointer">
                First 1 min
              </button>
              <button onClick={() => { onStartTimeChange('00:00:00'); onEndTimeChange('00:00:30'); }}
                className="px-2.5 py-1 text-[11px] rounded-md border border-[#333] bg-[#1a1a1a] text-[#a1a1aa] cursor-pointer">
                First 30 sec
              </button>
            </div>
            <div className="flex gap-3 pl-4 border-l border-[#1f1f1f]">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[#52525b] text-xs">Start time</label>
                <input
                  type="text"
                  placeholder="00:00:00"
                  value={startTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm outline-none font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[#52525b] text-xs">End time</label>
                <input
                  type="text"
                  placeholder="00:00:00"
                  value={endTime}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        disabled={downloadState === "downloading"}
        className={`w-full py-3 rounded-xl text-sm font-semibold border-none transition-colors
          ${downloadState === "downloading" ? 'bg-[#1f1f1f] text-[#52525b] cursor-not-allowed' :
            downloadState === "done" ? 'bg-[#22c55e] text-white cursor-pointer' :
            'bg-[#6366f1] text-white cursor-pointer'}`}
      >
        {downloadState === "idle" && "Download"}
        {downloadState === "downloading" && "Downloading..."}
        {downloadState === "done" && "Downloaded"}
        {downloadState === "error" && "Retry Download"}
      </button>
    </div>
  )
}
