"use client"
import { DownloadJob } from "../types/index"
import PreviewCard from "./PreviewCard"
import DownloadOptions from "./DownloadOptions"
import ProgressBar from "./ProgressBar"

interface Props {
  job: DownloadJob
  onDownload: () => void
  onRemove: () => void
  onUpdateField: (field: string, value: any) => void
}

export default function JobCard({ job, onDownload, onRemove, onUpdateField }: Props) {
  return (
    <div className="w-full bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      
      {job.fetchStatus === "loading" && (
        <div className="p-5 flex items-center gap-4">
          <div className="w-6 h-6 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="text-[#f5f5f5] text-sm font-medium">Fetching video info...</p>
            <p className="text-[#3f3f46] text-xs truncate max-w-[400px]">{job.url}</p>
          </div>
        </div>
      )}

      {job.fetchStatus === "error" && (
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444] text-xs flex-shrink-0">✕</div>
            <p className="text-[#ef4444] text-sm">{job.fetchError}</p>
          </div>
          <button onClick={onRemove} className="text-[#3f3f46] hover:text-[#f5f5f5] text-xs transition-colors whitespace-nowrap">Remove</button>
        </div>
      )}

      {job.fetchStatus === "success" && (
        <>
          <div className="flex justify-end px-4 pt-3">
            {job.downloadState !== "downloading" && (
              <button onClick={onRemove} className="text-[#3f3f46] hover:text-[#ef4444] text-xs transition-colors">✕ Remove</button>
            )}
          </div>
          <PreviewCard videoInfo={job.videoInfo} />
          <DownloadOptions
            formats={job.videoInfo?.formats || []}
            selectedQuality={job.selectedQuality}
            selectedFormat={job.selectedFormat}
            startTime={job.startTime}
            endTime={job.endTime}
            onQualityChange={(v) => onUpdateField("selectedQuality", v)}
            onFormatChange={(v) => onUpdateField("selectedFormat", v)}
            onStartTimeChange={(v) => onUpdateField("startTime", v)}
            onEndTimeChange={(v) => onUpdateField("endTime", v)}
            onDownload={onDownload}
            downloadState={job.downloadState}
          />
          {(job.downloadState === "downloading" || job.downloadState === "done") && (
            <ProgressBar
              progress={job.progress}
              speed={job.speed}
              eta={job.eta}
              downloadState={job.downloadState}
              filename={job.outputFilename}
            />
          )}
        </>
      )}
    </div>
  )
}