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
    <div style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px'}}>

      {/* Format Toggle */}
      <div style={{display: 'flex', gap: '8px', padding: '4px', backgroundColor: '#0a0a0a', borderRadius: '12px', border: '1px solid #1f1f1f'}}>
        {[{ label: "Video (MP4)", value: "mp4" }, { label: "Audio only (MP3)", value: "mp3" }].map(opt => (
          <button
            key={opt.value}
            onClick={() => onFormatChange(opt.value)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedFormat === opt.value ? '#6366f1' : 'transparent',
              color: selectedFormat === opt.value ? '#ffffff' : '#71717a',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Quality Pills */}
      {selectedFormat === "mp4" && videoFormats.length > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <p style={{color: '#52525b', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Quality</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
            {videoFormats.map((f) => (
              <button
                key={f.quality}
                onClick={() => onQualityChange(f.quality)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: selectedQuality === f.quality ? '1px solid #6366f1' : '1px solid #333333',
                  cursor: 'pointer',
                  backgroundColor: selectedQuality === f.quality ? '#6366f1' : '#1a1a1a',
                  color: '#ffffff',
                  minWidth: '60px',
                }}
              >
                {f.quality}{f.filesize_mb > 0 ? ` ~${f.filesize_mb}MB` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Clip Cutter */}
      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#52525b',
            fontSize: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span style={{transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s'}}>&#9658;</span>
          Clip a specific portion
        </button>
        {showAdvanced && (
          <div>
            <div style={{display:'flex', gap:'6px', marginBottom:'8px'}}>
              <button onClick={() => { onStartTimeChange('00:00:00'); onEndTimeChange('00:05:00'); }}
                style={{padding:'4px 10px', fontSize:'11px', borderRadius:'6px', border:'1px solid #333', backgroundColor:'#1a1a1a', color:'#a1a1aa', cursor:'pointer'}}>
                First 5 min
              </button>
              <button onClick={() => { onStartTimeChange('00:00:00'); onEndTimeChange('00:01:00'); }}
                style={{padding:'4px 10px', fontSize:'11px', borderRadius:'6px', border:'1px solid #333', backgroundColor:'#1a1a1a', color:'#a1a1aa', cursor:'pointer'}}>
                First 1 min
              </button>
              <button onClick={() => { onStartTimeChange('00:00:00'); onEndTimeChange('00:00:30'); }}
                style={{padding:'4px 10px', fontSize:'11px', borderRadius:'6px', border:'1px solid #333', backgroundColor:'#1a1a1a', color:'#a1a1aa', cursor:'pointer'}}>
                First 30 sec
              </button>
            </div>
            <div style={{display: 'flex', gap: '12px', paddingLeft: '16px', borderLeft: '1px solid #1f1f1f'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '6px', flex: 1}}>
                <label style={{color: '#52525b', fontSize: '12px'}}>Start time</label>
                <input
                  type="text"
                  placeholder="00:00:00"
                  value={startTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  style={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1f1f1f',
                    color: '#f5f5f5',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '6px', flex: 1}}>
                <label style={{color: '#52525b', fontSize: '12px'}}>End time</label>
                <input
                  type="text"
                  placeholder="00:00:00"
                  value={endTime}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                  style={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1f1f1f',
                    color: '#f5f5f5',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
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
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: downloadState === "downloading" ? 'not-allowed' : 'pointer',
          backgroundColor: downloadState === "downloading" ? '#1f1f1f' : downloadState === "done" ? '#22c55e' : '#6366f1',
          color: downloadState === "downloading" ? '#52525b' : '#ffffff',
        }}
      >
        {downloadState === "idle" && "Download"}
        {downloadState === "downloading" && "Downloading..."}
        {downloadState === "done" && "Downloaded"}
        {downloadState === "error" && "Retry Download"}
      </button>
    </div>
  )
}
