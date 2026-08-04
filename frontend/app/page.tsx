"use client"
import React, { useState, useEffect } from "react"
import { DownloadJob } from "../types/index"
import UrlInput from "../components/UrlInput"
import JobCard from "../components/JobCard"

const isYouTubeUrl = (url: string): boolean => {
  const ytPatterns = [
    /youtube\.com/,
    /youtu\.be/,
    /m\.youtube\.com/,
    /youtube-nocookie\.com/,
  ]
  return ytPatterns.some(p => p.test(url))
}

function FeedbackForm() {
  const [feedback, setFeedback] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle")

  const handleSubmit = async () => {
    if (!feedback.trim()) return
    setStatus("sending")
    try {
      const res = await fetch("https://formsubmit.co/ajax/nftboy1010@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          feedback,
          email: email || "Anonymous",
          _subject: "ClipNest Feedback",
        })
      })
      if (res.ok) {
        setStatus("sent")
        setFeedback("")
        setEmail("")
        setTimeout(() => setStatus("idle"), 5000)
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="mt-8 border-t border-[#1f1f1f] pt-8">
      <h3 className="text-[#71717a] text-sm text-center mb-4">
        💬 Share your feedback or feature requests
      </h3>
      <div className="flex flex-col gap-3">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What do you think? What features would you like to see?"
          rows={3}
          className="w-full bg-[#111111] border border-[#1f1f1f] rounded-lg px-4 py-3 text-[#f5f5f5] text-sm placeholder-[#3f3f46] resize-none focus:outline-none focus:border-[#6366f1]"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email (optional)"
          className="w-full bg-[#111111] border border-[#1f1f1f] rounded-lg px-4 py-3 text-[#f5f5f5] text-sm placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1]"
        />
        <button
          onClick={handleSubmit}
          disabled={status === "sending"}
          className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 text-white text-sm font-medium py-3 rounded-lg transition-colors"
        >
          {status === "sending" ? "Sending..." : "Send Feedback"}
        </button>
        {status === "sent" && (
          <div className="w-full bg-[#111111] border border-[#22c55e] text-[#22c55e] text-sm py-2 rounded-lg text-center">
            ✅ Feedback sent! Thank you.
          </div>
        )}
        {status === "error" && (
          <div className="w-full bg-[#111111] border border-[#ef4444] text-[#ef4444] text-sm py-2 rounded-lg text-center">
            ❌ Failed to send. Please try again.
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [installPrompt, setInstallPrompt] = React.useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = React.useState(false)
  const [showYouTubeBlock, setShowYouTubeBlock] = React.useState(false)
  const [showAlternatives, setShowAlternatives] = React.useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === "accepted") {
      setShowInstallBanner(false)
      setInstallPrompt(null)
    }
  }

  useEffect(() => {
    const handleOffline = () => {
      alert("⚠️ No internet connection detected. Please check your network and try again.");
    };
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 10);

  const updateJob = (jobId: string, updates: Partial<DownloadJob>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
    );
  };

  const addJob = (url: string) => {
    if (url.trim() === "") return;
    if (isYouTubeUrl(url.trim())) {
      setShowYouTubeBlock(true)
      return
    }
    if (jobs.some((job) => job.url === url)) return;

    const newJob: DownloadJob = {
      id: generateId(),
      url,
      videoInfo: null,
      fetchStatus: "loading",
      fetchError: "",
      selectedQuality: "720p",
      selectedFormat: "mp4",
      startTime: "",
      endTime: "",
      downloadState: "idle",
      progress: 0,
      speed: "",
      eta: "",
      downloadError: "",
      outputFilename: "",
      fileId: "",
    };

    setJobs((prev) => [newJob, ...prev]);
    fetchJobInfo(newJob.id, url);
  };

  const fetchJobInfo = async (jobId: string, url: string) => {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/info",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        updateJob(jobId, { fetchStatus: "success", videoInfo: data });
      } else {
        let errorMsg = data.error || "Failed to fetch video info";
        if (errorMsg.toLowerCase().includes("private")) {
          errorMsg = "🔒 This video is private. Only the owner can access it.";
        } else if (errorMsg.toLowerCase().includes("sign in") || errorMsg.toLowerCase().includes("bot")) {
          errorMsg = "⚠️ YouTube downloads are temporarily unavailable. Try TikTok, Instagram, Twitter or Facebook instead.";
        } else if (errorMsg.toLowerCase().includes("not exist") || errorMsg.toLowerCase().includes("removed") || errorMsg.toLowerCase().includes("deleted")) {
          errorMsg = "❌ This video no longer exists or has been removed.";
        } else if (errorMsg.toLowerCase().includes("region") || errorMsg.toLowerCase().includes("available in your country")) {
          errorMsg = "🌍 This video is not available in your region.";
        }
        updateJob(jobId, {
          fetchStatus: "error",
          fetchError: errorMsg,
        });
      }
    } catch (error) {
      updateJob(jobId, {
        fetchStatus: "error",
        fetchError: !navigator.onLine 
          ? "📶 No internet connection. Please check your network and try again."
          : "Network error. Could not reach the server. Please try again.",
      });
    }
  };

  const startDownload = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    updateJob(jobId, {
      downloadState: "downloading",
      progress: 0,
      speed: "",
      eta: "",
      downloadError: "",
    });

    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download/stream?url=${encodeURIComponent(job.url)}&quality=${job.selectedQuality}&format_type=${job.selectedFormat}${job.startTime ? `&start_time=${job.startTime}` : ""}${job.endTime ? `&end_time=${job.endTime}` : ""}`;
    console.log("SSE URL:", sseUrl);

    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      console.log("SSE event received:", event.data);

      // Ignore heartbeat comments and empty events
      if (!event.data || event.data.trim() === "") return;

      let parsed: any;
      try {
        parsed = JSON.parse(event.data);
      } catch (e) {
        console.log("SSE non-JSON event ignored:", event.data);
        return;
      }

      if (parsed.status === "downloading") {
        const percentNum = parseFloat(
          String(parsed.percent).replace("%", "")
        ) || 0;
        updateJob(jobId, {
          progress: percentNum,
          speed: parsed.speed,
          eta: parsed.eta,
        });
      } else if (parsed.status === "retrying") {
        updateJob(jobId, {
          speed: `Retrying... attempt ${parsed.attempt}`,
        });
      } else if (parsed.status === "processing") {
        updateJob(jobId, { progress: 99, speed: "Processing...", eta: "" });
      } else if (parsed.status === "done") {
        updateJob(jobId, {
          downloadState: "done",
          progress: 100,
          fileId: parsed.file_id,
          outputFilename: parsed.filename,
        });
        eventSource.close();

        try {
          const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download/file/${parsed.file_id}`;
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = parsed.filename || "download";
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
          }, 1000);
        } catch (downloadErr) {
          console.error("Download trigger failed:", downloadErr);
          window.open(
            `${process.env.NEXT_PUBLIC_API_URL}/api/download/file/${parsed.file_id}`,
            "_blank"
          );
        }
      } else if (parsed.status === "error") {
        updateJob(jobId, {
          downloadState: "error",
          downloadError: parsed.message,
        });
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      updateJob(jobId, {
        downloadState: "error",
        downloadError: "Connection lost. Please try again.",
      });
      eventSource.close();
    };
  };

  const updateJobField = (jobId: string, field: string, value: any) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, [field]: value } : j))
    );
  };

  const removeJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  return (
  <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[680px] mx-auto px-4 pt-12 pb-24 flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Clip<span className="text-[#6366f1]">Nest</span>
            </h1>
          </div>
          <p className="text-[#71717a] text-sm max-w-sm leading-relaxed">
            Paste any video link from TikTok, Instagram, Twitter, Facebook and 1000+ sites. No ads, no signup.
          </p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-[#3f3f46] text-xs">TikTok</span>
            <span className="text-[#3f3f46] text-xs">·</span>
            <span className="text-[#3f3f46] text-xs">Instagram</span>
            <span className="text-[#3f3f46] text-xs">·</span>
            <span className="text-[#3f3f46] text-xs">Twitter</span>
            <span className="text-[#3f3f46] text-xs">·</span>
            <span className="text-[#3f3f46] text-xs">Facebook</span>
            <span className="text-[#3f3f46] text-xs">·</span>
            <span className="text-[#3f3f46] text-xs">1000+ more</span>
          </div>
        </div>

        {/* URL Input */}
        <UrlInput onFetch={addJob} isLoading={false} error="" />

        {/* How it works section */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-lg">📋</div>
            <p className="text-[#52525b] text-xs leading-relaxed">Paste any video link from 1000+ sites</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-lg">⚡</div>
            <p className="text-[#52525b] text-xs leading-relaxed">Choose quality and format</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-lg">✅</div>
            <p className="text-[#52525b] text-xs leading-relaxed">Download instantly. No watermark, no signup, no ads.</p>
          </div>
        </div>

        <a
          href="/movies"
          className="flex items-center justify-between bg-[#111111] border border-[#1f1f1f] hover:border-[#6366f1] rounded-xl px-4 py-3 transition-colors group"
        >
          <div>
            <p className="text-white text-sm font-medium">🎬 Movie Gallery</p>
            <p className="text-[#52525b] text-xs mt-0.5">
              Browse & download free legal public domain films
            </p>
          </div>
          <span className="text-[#6366f1] text-sm group-hover:translate-x-1 transition-transform">→</span>
        </a>

{showYouTubeBlock && (
  <div className="bg-[#111111] border border-[#262626] rounded-xl p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-white text-sm font-semibold">
          YouTube is currently unavailable
        </p>
        <p className="text-[#71717a] text-xs mt-1 leading-relaxed">
          We have disabled YouTube downloads to keep ClipNest fast,
          free, and reliable for everyone.
        </p>
      </div>
      <button
        onClick={() => { setShowYouTubeBlock(false); setShowAlternatives(false); }}
        className="text-[#52525b] text-xs shrink-0 mt-0.5"
      >
        ✕
      </button>
    </div>
    <button
      onClick={() => setShowAlternatives(!showAlternatives)}
      className="text-[#6366f1] text-xs text-left hover:underline"
    >
      {showAlternatives ? "▲ Hide alternatives" : "▼ Looking for similar long videos? Click here for alternatives →"}
    </button>
    {showAlternatives && (
      <div className="flex flex-col gap-4 pt-2 border-t border-[#1f1f1f]">
        <p className="text-[#a1a1aa] text-xs leading-relaxed">
          You can still find many long videos, lectures, documentaries,
          and independent content on these platforms. They download
          cleanly in ClipNest — just like TikTok and Instagram.
        </p>
        <div className="flex flex-col gap-3">
          <div className="bg-[#0a0a0a] rounded-lg p-3">
            <p className="text-white text-xs font-semibold mb-1">
              🎬 PeerTube — Recommended
            </p>
            <p className="text-[#71717a] text-xs leading-relaxed mb-2">
              Open-source decentralized alternative to YouTube. Many
              independent servers with lectures, documentaries, and
              independent content.
            </p>
            <p className="text-[#a1a1aa] text-xs font-medium mb-1">
              Good starting points:
            </p>
            <div className="flex flex-col gap-1">
              {["https://peertube.tv", "https://tilvids.com", "https://makertube.net", "https://framatube.org"].map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-[#6366f1] text-xs hover:underline">
                  {url}
                </a>
              ))}
            </div>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3">
            <p className="text-white text-xs font-semibold mb-1">
              📺 Odysee
            </p>
            <p className="text-[#71717a] text-xs leading-relaxed mb-2">
              Decentralized video platform with independent and
              alternative content.
            </p>
            <a href="https://odysee.com" target="_blank" rel="noopener noreferrer"
              className="text-[#6366f1] text-xs hover:underline">
              https://odysee.com
            </a>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3">
            <p className="text-white text-xs font-semibold mb-1">
              🗄️ Internet Archive
            </p>
            <p className="text-[#71717a] text-xs leading-relaxed mb-2">
              Excellent for long-form content — lectures, documentaries,
              public domain videos, and old films.
            </p>
            <a href="https://archive.org" target="_blank" rel="noopener noreferrer"
              className="text-[#6366f1] text-xs hover:underline">
              https://archive.org
            </a>
          </div>
        </div>
        <p className="text-[#52525b] text-xs leading-relaxed">
          💡 Once you have a link from PeerTube, Odysee, or Internet
          Archive — paste it into ClipNest the same way you do with
          TikTok or Instagram.
        </p>
      </div>
    )}
  </div>
)}

  {showInstallBanner && (
    <div className="flex items-center justify-between bg-[#111111] border border-[#6366f1] rounded-xl px-4 py-3 gap-3">
      <div className="flex-1">
        <p className="text-white text-sm font-medium">📱 Install ClipNest</p>
        <p className="text-[#71717a] text-xs mt-0.5">Add to home screen for instant access</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setShowInstallBanner(false)}
          className="text-[#52525b] text-xs px-2 py-1"
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          className="bg-[#6366f1] text-white text-xs px-3 py-2 rounded-lg font-medium"
        >
          Install
        </button>
      </div>
    </div>
  )}

      {/* Jobs or Empty State */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-2xl">
            📋
          </div>
          <div className="text-center">
            <p className="text-[#52525b] text-sm">No downloads yet</p>
            <p className="text-[#3f3f46] text-xs mt-1">Paste a link above to get started</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
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

      {/* Feedback form */}
      <FeedbackForm />
    </div>
  </div>
  );
}
