"use client"
import { useState, useEffect } from "react"

interface Props {
  onFetch: (url: string) => void
  isLoading: boolean
  error: string
}

export default function UrlInput({ onFetch, isLoading, error }: Props) {
  const [url, setUrl] = useState("")

  useEffect(() => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then((text) => {
        const videoPatterns = [
          /youtube\.com\/watch/,
          /youtu\.be\//,
          /tiktok\.com/,
          /instagram\.com/,
          /twitter\.com/,
          /x\.com/,
          /facebook\.com/,
          /reddit\.com/,
          /vimeo\.com/,
        ]
        if (videoPatterns.some(p => p.test(text))) {
          setUrl(text)
        }
      }).catch(() => {})
    }
  }, [])

  function handleSubmit() {
    if (!url.trim()) return
    onFetch(url.trim())
    setUrl("")
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
          placeholder="Paste a video link here..."
          className="flex-1 bg-white/10 backdrop-blur-md border border-white/25 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#6366f1] focus:bg-white/15 focus:border-opacity-80 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200"
        />
        <button
          onClick={handleSubmit}
          disabled={!url.trim()}
          className="w-full md:w-auto bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
        >
          + Add
        </button>
      </div>
      <p className="text-white/40 text-xs px-1">
        Press Enter or click Add — you can queue multiple links
      </p>
    </div>
  )
}