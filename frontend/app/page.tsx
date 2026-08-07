"use client"
import React, { useState, useEffect, useRef } from "react"
import { DownloadJob } from "../types/index"
import UrlInput from "../components/UrlInput"
import JobCard from "../components/JobCard"

const isYouTubeUrl = (url: string): boolean => {
  const ytPatterns = [/youtube\.com/, /youtu\.be/, /m\.youtube\.com/, /youtube-nocookie\.com/]
  return ytPatterns.some(p => p.test(url))
}

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    let animId: number

    const lines: Array<{x: number; y: number; len: number; angle: number; speed: number; opacity: number; width: number}> = []
    const dots: Array<{x: number; y: number; vx: number; vy: number; opacity: number; size: number}> = []

    const init = () => {
      lines.length = 0
      dots.length = 0
      const lineCount = Math.floor(w * h / 80000)
      const dotCount = Math.floor(w * h / 20000)
      for (let i = 0; i < lineCount; i++) {
        lines.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: Math.random() * 60 + 20,
          angle: Math.random() * Math.PI * 2,
          speed: (Math.random() - 0.5) * 0.003,
          opacity: Math.random() * 0.08 + 0.02,
          width: Math.random() * 0.5 + 0.3,
        })
      }
      for (let i = 0; i < dotCount; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          opacity: Math.random() * 0.2 + 0.05,
          size: Math.random() * 1 + 0.3,
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      lines.forEach(l => {
        l.angle += l.speed
        const x2 = l.x + Math.cos(l.angle) * l.len
        const y2 = l.y + Math.sin(l.angle) * l.len
        ctx.beginPath()
        ctx.moveTo(l.x, l.y)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = `rgba(99,102,241,${l.opacity})`
        ctx.lineWidth = l.width
        ctx.stroke()
      })
      dots.forEach(d => {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0) d.x = w
        if (d.x > w) d.x = 0
        if (d.y < 0) d.y = h
        if (d.y > h) d.y = 0
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${d.opacity})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }

    init()
    draw()
    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      init()
    }
    window.addEventListener("resize", onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize) }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", top: 0, left: 0,
      width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 0,
    }} />
  )
}

function FeedbackForm() {
  const [open, setOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<"idle"|"sending"|"sent"|"error">("idle")

  const handleSubmit = async () => {
    if (!feedback.trim()) return
    setStatus("sending")
    try {
      const res = await fetch("https://formsubmit.co/ajax/nftboy1010@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ feedback, email: email || "Anonymous", _subject: "ClipNest Feedback" })
      })
      if (res.ok) {
        setStatus("sent")
        setFeedback("")
        setEmail("")
        setTimeout(() => { setStatus("idle"); setOpen(false) }, 3000)
      } else setStatus("error")
    } catch { setStatus("error") }
  }

  return (
    <div className="flex justify-center py-6">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-[#3f3f46] hover:text-[#6366f1] text-xs tracking-[0.2em] uppercase transition-colors duration-300">
          Feedback
        </button>
      ) : (
        <div className="w-full max-w-md bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 flex flex-col gap-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <p className="text-[#52525b] text-xs tracking-wide">Share your thoughts</p>
            <button onClick={() => { setOpen(false); setStatus("idle") }}
              className="text-[#3f3f46] hover:text-white text-xs transition-colors">✕</button>
          </div>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
            placeholder="What would make ClipNest better for you?"
            rows={3}
            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-[#d4d4d8] text-xs placeholder-[#3f3f46] resize-none focus:outline-none focus:border-[#6366f1] transition-colors" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-[#d4d4d8] text-xs placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1] transition-colors" />
          {status === "sent" ? (
            <p className="text-[#22c55e] text-xs text-center py-1">✓ Thank you — received.</p>
          ) : (
            <button onClick={handleSubmit} disabled={status === "sending"}
              className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-40 text-white text-xs font-medium py-2.5 rounded-xl transition-colors">
              {status === "sending" ? "Sending…" : "Send"}
            </button>
          )}
          {status === "error" && <p className="text-[#ef4444] text-xs text-center">Failed — please try again.</p>}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [jobs, setJobs] = useState<DownloadJob[]>([])
  const [installPrompt, setInstallPrompt] = React.useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = React.useState(false)
  const [showYouTubeBlock, setShowYouTubeBlock] = React.useState(false)
  const [showAlternatives, setShowAlternatives] = React.useState(false)

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true) }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  useEffect(() => {
    const handleOffline = () => alert("No internet connection. Please check your network.")
    window.addEventListener("offline", handleOffline)
    return () => window.removeEventListener("offline", handleOffline)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === "accepted") { setShowInstallBanner(false); setInstallPrompt(null) }
  }

  const generateId = () => Math.random().toString(36).substring(2, 10)

  const updateJob = (jobId: string, updates: Partial<DownloadJob>) =>
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updates } : j))

  const addJob = (url: string) => {
    if (!url.trim()) return
    if (isYouTubeUrl(url.trim())) { setShowYouTubeBlock(true); return }
    if (jobs.some(j => j.url === url)) return
    const newJob: DownloadJob = {
      id: generateId(), url, videoInfo: null, fetchStatus: "loading",
      fetchError: "", selectedQuality: "720p", selectedFormat: "mp4",
      startTime: "", endTime: "", downloadState: "idle", progress: 0,
      speed: "", eta: "", downloadError: "", outputFilename: "", fileId: "",
    }
    setJobs(prev => [newJob, ...prev])
    fetchJobInfo(newJob.id, url)
  }

  const fetchJobInfo = async (jobId: string, url: string) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await response.json()
      if (response.ok) {
        updateJob(jobId, { fetchStatus: "success", videoInfo: data })
      } else {
        let errorMsg = data.error || "Failed to fetch video info"
        if (errorMsg.toLowerCase().includes("private"))
          errorMsg = "This video is private. Only the owner can access it."
        else if (errorMsg.toLowerCase().includes("sign in") || errorMsg.toLowerCase().includes("bot"))
          errorMsg = "YouTube is currently unavailable. Try TikTok, Instagram, Twitter or Facebook."
        else if (errorMsg.toLowerCase().includes("not exist") || errorMsg.toLowerCase().includes("removed"))
          errorMsg = "This video no longer exists or has been removed."
        else if (errorMsg.toLowerCase().includes("region"))
          errorMsg = "This video is not available in your region."
        updateJob(jobId, { fetchStatus: "error", fetchError: errorMsg })
      }
    } catch {
      updateJob(jobId, {
        fetchStatus: "error",
        fetchError: !navigator.onLine
          ? "No internet connection. Please check your network."
          : "Could not reach the server. Please try again.",
      })
    }
  }

  const startDownload = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    updateJob(jobId, { downloadState: "downloading", progress: 0, speed: "", eta: "", downloadError: "" })
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download/stream?url=${encodeURIComponent(job.url)}&quality=${job.selectedQuality}&format_type=${job.selectedFormat}${job.startTime ? `&start_time=${job.startTime}` : ""}${job.endTime ? `&end_time=${job.endTime}` : ""}`
    const eventSource = new EventSource(sseUrl)
    eventSource.onmessage = (event) => {
      if (!event.data?.trim()) return
      let parsed: any
      try { parsed = JSON.parse(event.data) } catch { return }
      if (parsed.status === "downloading") {
        updateJob(jobId, { progress: parseFloat(String(parsed.percent).replace("%", "")) || 0, speed: parsed.speed, eta: parsed.eta })
      } else if (parsed.status === "processing") {
        updateJob(jobId, { progress: 99, speed: "Processing…", eta: "" })
      } else if (parsed.status === "done") {
        updateJob(jobId, { downloadState: "done", progress: 100, fileId: parsed.file_id, outputFilename: parsed.filename })
        eventSource.close()
        try {
          const a = document.createElement("a")
          a.href = `${process.env.NEXT_PUBLIC_API_URL}/api/download/file/${parsed.file_id}`
          a.download = parsed.filename || "download"
          a.style.display = "none"
          document.body.appendChild(a)
          a.click()
          setTimeout(() => document.body.removeChild(a), 1000)
        } catch {
          window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/download/file/${parsed.file_id}`, "_blank")
        }
      } else if (parsed.status === "error") {
        updateJob(jobId, { downloadState: "error", downloadError: parsed.message })
        eventSource.close()
      }
    }
    eventSource.onerror = () => {
      updateJob(jobId, { downloadState: "error", downloadError: "Connection lost. Please try again." })
      eventSource.close()
    }
  }

  const updateJobField = (jobId: string, field: string, value: any) =>
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, [field]: value } : j))

  const removeJob = (jobId: string) =>
    setJobs(prev => prev.filter(j => j.id !== jobId))

  return (
    <div className="min-h-screen bg-[#080808] relative overflow-hidden">
      <AnimatedBackground />

      {/* Subtle gradient overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)",
      }} />

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#6366f1] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">ClipNest</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#3f3f46] text-xs">No signup required</span>
            {showInstallBanner && (
              <button onClick={handleInstall}
                className="text-xs bg-[#6366f1] hover:bg-[#5558e3] text-white px-3 py-1.5 rounded-lg transition-colors">
                Install App
              </button>
            )}
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-start px-4 pt-12 pb-24 max-w-2xl mx-auto w-full gap-8">

          {/* Hero text */}
          <div className="text-center flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 bg-[#111111] border border-[#1a1a1a] rounded-full px-3 py-1.5 mx-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[#71717a] text-xs">Free · No watermark · No signup</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Download any video.<br />
              <span className="text-[#6366f1]">Instantly.</span>
            </h1>
            <p className="text-[#71717a] text-base max-w-md mx-auto leading-relaxed">
              Paste a link from TikTok, Instagram, Twitter, Facebook
              or 1000+ other platforms. Get the file in seconds.
            </p>
          </div>

          {/* Supported platforms */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {["TikTok", "Instagram", "Twitter", "Facebook", "Vimeo", "1000+ more"].map((p, i) => (
              <span key={p} className={`text-xs px-2.5 py-1 rounded-full border ${i < 5 ? "border-[#1a1a1a] text-[#52525b] bg-[#0f0f0f]" : "text-[#3f3f46]"}`}>
                {p}
              </span>
            ))}
          </div>

          {/* URL Input */}
          <div className="w-full">
            <UrlInput onFetch={addJob} isLoading={false} error="" />
          </div>

          {/* YouTube block */}
          {showYouTubeBlock && (
            <div className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">YouTube is currently unavailable</p>
                  <p className="text-[#52525b] text-xs mt-1 leading-relaxed">
                    We have disabled YouTube to keep ClipNest fast and reliable for everyone.
                  </p>
                </div>
                <button onClick={() => { setShowYouTubeBlock(false); setShowAlternatives(false) }}
                  className="text-[#3f3f46] hover:text-white text-xs transition-colors">✕</button>
              </div>
              <button onClick={() => setShowAlternatives(!showAlternatives)}
                className="text-[#6366f1] text-xs text-left hover:underline">
                {showAlternatives ? "Hide alternatives ↑" : "Find similar content on other platforms →"}
              </button>
              {showAlternatives && (
                <div className="flex flex-col gap-2 pt-3 border-t border-[#1a1a1a]">
                  <p className="text-[#52525b] text-xs leading-relaxed mb-1">
                    These platforms work perfectly with ClipNest:
                  </p>
                  {[
                    { name: "PeerTube", url: "https://peertube.tv", desc: "Open-source video — lectures, docs, indie content" },
                    { name: "Odysee", url: "https://odysee.com", desc: "Decentralized video platform" },
                    { name: "Internet Archive", url: "https://archive.org", desc: "Public domain films, lectures, documentaries" },
                  ].map(s => (
                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-3 py-2.5 hover:border-[#6366f1] transition-colors group">
                      <div>
                        <p className="text-white text-xs font-medium">{s.name}</p>
                        <p className="text-[#52525b] text-xs">{s.desc}</p>
                      </div>
                      <span className="text-[#3f3f46] group-hover:text-[#6366f1] text-xs transition-colors">→</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Jobs or Empty State */}
          {jobs.length === 0 ? (
            <div className="w-full flex flex-col items-center gap-6 py-8">
              {/* How it works */}
              <div className="w-full grid grid-cols-3 gap-3">
                {[
                  { step: "01", title: "Paste link", desc: "Any video URL from 1000+ platforms" },
                  { step: "02", title: "Choose format", desc: "Select quality, format or audio only" },
                  { step: "03", title: "Download", desc: "Get your file. No watermark added." },
                ].map(item => (
                  <div key={item.step} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-4 flex flex-col gap-2">
                    <span className="text-[#6366f1] text-xs font-mono">{item.step}</span>
                    <p className="text-white text-xs font-medium">{item.title}</p>
                    <p className="text-[#52525b] text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDownload={() => startDownload(job.id)}
                  onRemove={() => removeJob(job.id)}
                  onUpdateField={(field, value) => updateJobField(job.id, field, value)}
                />
              ))}
            </div>
          )}

          <FeedbackForm />
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-4 border-t border-[#0f0f0f]">
          <p className="text-[#2a2a2a] text-xs">
            ClipNest · Free forever · No ads
          </p>
        </footer>
      </div>
    </div>
  )
}