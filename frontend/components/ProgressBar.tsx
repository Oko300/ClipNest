"use client"

function stripAnsi(str: string): string {
  return str ? str.replace(/\u001b\[[0-9;]*m/g, '').replace(/\[[\d;]*m/g, '').trim() : ''
}

interface Props {
  progress: number
  speed: string
  eta: string
  downloadState: "idle" | "downloading" | "done" | "error"
  filename: string
}

export default function ProgressBar({ progress, speed, eta, downloadState, filename }: Props) {
  return (
    <div className="px-4 pb-4 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-[#52525b] text-xs">
          {downloadState === "done"
            ? `✓ ${filename || "Download complete"}`
            : `${stripAnsi(speed) || "Starting..."}${stripAnsi(eta) ? ` · ${stripAnsi(eta)} left` : ""}`}
        </span>
        <span className={`text-xs font-semibold tabular-nums ${downloadState === "done" ? "text-[#22c55e]" : "text-[#f5f5f5]"}`}>
          {progress.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-[#1f1f1f] rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${downloadState === "done" ? "bg-[#22c55e]" : "bg-[#6366f1]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
