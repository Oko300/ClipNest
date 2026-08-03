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
          className="flex-1 bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-3 text-[#f5f5f5] text-sm placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1]"
        />
        <button
          onClick={handleSubmit}
          disabled={!url.trim()}
          className="w-full md:w-auto bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
        >
          + Add
        </button>
      </div>
      <p className="text-[#3f3f46] text-xs px-1">
        Press Enter or click Add — you can queue multiple links
      </p>
    </div>
  )
}