"use client"
import { useState } from "react"
import { DownloadJob } from "../types/index"
import UrlInput from "../components/UrlInput"
import JobCard from "../components/JobCard"

export default function Home() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 10);

  const updateJob = (jobId: string, updates: Partial<DownloadJob>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
    );
  };

  const addJob = (url: string) => {
    if (url.trim() === "") return;
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
        updateJob(jobId, {
          fetchStatus: "error",
          fetchError: data.error || "Failed to fetch video info",
        });
      }
    } catch (error) {
      updateJob(jobId, {
        fetchStatus: "error",
        fetchError: "Network error. Is the backend running?",
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
    <div className="max-w-[680px] mx-auto px-4 py-16 flex flex-col gap-8">
      
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
    </div>
  </div>
  );
}
