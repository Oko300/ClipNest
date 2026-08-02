export interface DownloadJob {
  id: string
  url: string
  videoInfo: any
  fetchStatus: "idle" | "loading" | "success" | "error"
  fetchError: string
  selectedQuality: string
  selectedFormat: string
  startTime: string
  endTime: string
  downloadState: "idle" | "downloading" | "done" | "error"
  progress: number
  speed: string
  eta: string
  downloadError: string
  outputFilename: string
  fileId: string
}