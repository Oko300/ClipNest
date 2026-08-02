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
      <div className="flex gap-2 p-1.5 bg-[#111111] border border-[#1f1f1f] rounded-2xl focus-within:border-[#6366f1] transition-colors">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
          placeholder="Paste a video link here..."
          className="flex-1 bg-transparent text-[#f5f5f5] placeholder-[#3f3f46] px-3 py-2.5 text-sm outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!url.trim()}
          className="bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
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