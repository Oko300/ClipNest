export const metadata = {
  title: "About ClipNest — Free Video Downloader",
  description: "ClipNest is a free, no-signup video downloader that works with TikTok, Instagram, Twitter, Facebook and 1000+ platforms. No watermark, no ads.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#d4d4d8]">
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <a href="/" className="text-[#6366f1] text-sm hover:underline">← Back to ClipNest</a>
          <h1 className="text-3xl font-bold text-white">About ClipNest</h1>
          <p className="text-[#71717a] text-sm">
            Last updated: August 2026 ·{" "}
            <a href="https://clip-nest-ten.vercel.app" className="text-[#6366f1] hover:underline">
              clip-nest-ten.vercel.app
            </a>
          </p>
        </div>

        {/* What is ClipNest */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white text-lg font-semibold">What is ClipNest?</h2>
          <p className="text-[#a1a1aa] text-sm leading-relaxed">
            ClipNest is a free, open-access web-based video downloader. It allows anyone
            to download videos from TikTok, Instagram, Twitter (X), Facebook, Vimeo,
            and over 1000 other video platforms — directly in the browser, with no
            account required, no watermark added, and no ads shown.
          </p>
          <p className="text-[#a1a1aa] text-sm leading-relaxed">
            ClipNest is available at{" "}
            <a href="https://clip-nest-ten.vercel.app" className="text-[#6366f1] hover:underline">
              https://clip-nest-ten.vercel.app
            </a>{" "}
            and works on all modern browsers including Chrome, Firefox, Safari,
            and Edge. It is also installable as a Progressive Web App (PWA) on
            Android and iOS devices.
          </p>
        </section>

        {/* How it works */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white text-lg font-semibold">How it works</h2>
          <ol className="flex flex-col gap-2 text-[#a1a1aa] text-sm leading-relaxed list-none">
            <li className="flex gap-3">
              <span className="text-[#6366f1] font-mono text-xs mt-0.5">01</span>
              <span>Paste any video link from a supported platform into the input field.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#6366f1] font-mono text-xs mt-0.5">02</span>
              <span>ClipNest fetches the video metadata and shows available quality options (360p, 480p, 720p, 1080p) and format options (MP4 video or MP3/M4A/WAV audio).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#6366f1] font-mono text-xs mt-0.5">03</span>
              <span>Select your preferred quality and format, then click Download. A real-time progress bar shows the download status.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#6366f1] font-mono text-xs mt-0.5">04</span>
              <span>The file is saved directly to your device. No watermark is added. The file is deleted from ClipNest servers immediately after download.</span>
            </li>
          </ol>
        </section>

        {/* Features */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white text-lg font-semibold">Features</h2>
          <ul className="flex flex-col gap-2 text-[#a1a1aa] text-sm leading-relaxed">
            {[
              "Supports TikTok, Instagram, Twitter/X, Facebook, Vimeo and 1000+ platforms",
              "Download in multiple video qualities: 360p, 480p, 720p, 1080p",
              "Audio-only download in MP3, M4A, or WAV format",
              "Clip cutter — download only a specific portion of a video (start/end time)",
              "No watermark on downloaded files",
              "No account or signup required",
              "No ads",
              "Real-time download progress bar",
              "Metadata stripped from downloaded files for privacy",
              "Installable as a mobile app (PWA) on Android and iOS",
              "Works on desktop and mobile browsers",
              "Completely free to use",
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-[#6366f1] mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Supported platforms */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white text-lg font-semibold">Supported platforms</h2>
          <p className="text-[#a1a1aa] text-sm leading-relaxed">
            ClipNest currently supports downloading from the following platforms
            (among 1000+ others):
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "TikTok", "Instagram", "Twitter / X", "Facebook", "Vimeo",
              "Reddit", "Dailymotion", "Twitch clips", "PeerTube",
              "Odysee", "Internet Archive", "Bilibili", "Rumble",
              "Streamable", "Mixcloud", "SoundCloud",
            ].map((p) => (
              <span key={p}
                className="text-xs px-2.5 py-1 rounded-full border border-[#1a1a1a] text-[#71717a] bg-[#0f0f0f]">
                {p}
              </span>
            ))}
          </div>
          <p className="text-[#52525b] text-xs leading-relaxed">
            Note: YouTube is currently not supported due to platform restrictions.
            ClipNest recommends PeerTube, Odysee, and Internet Archive as
            alternatives for long-form video content.
          </p>
        </section>
        {/* Who is it for */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white text-lg font-semibold">Who is ClipNest for?</h2>
          <p className="text-[#a1a1aa] text-sm leading-relaxed">
            ClipNest is built for anyone who needs to save online videos for
            offline viewing, content creators who want to archive their own content,
            students and researchers collecting reference material, and anyone who
            wants a clean, fast, no-nonsense video downloading tool without paying
            for a subscription or creating an account.
          </p>
        </section>

        {/* Privacy */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white text-lg font-semibold">Privacy</h2>
          <p className="text-[#a1a1aa] text-sm leading-relaxed">
            ClipNest does not store any downloaded videos long-term. Files are
            temporarily processed on the server and immediately deleted after
            the download is delivered to the user — within 30 seconds of completion.
            ClipNest does not collect personal data, does not require login,
            and does not track individual user downloads. IP addresses are hidden
            from server logs.
          </p>
        </section>

        {/* Tech stack */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white text-lg font-semibold">Technical information</h2>
          <p className="text-[#a1a1aa] text-sm leading-relaxed">
            ClipNest is built with Next.js 14 (frontend) and FastAPI with Python
            (backend), using yt-dlp as the download engine and ffmpeg for media
            processing. The frontend is hosted on Vercel and the backend on Render.
            Downloads use Server-Sent Events (SSE) for real-time progress updates.
          </p>
        </section>

        {/* FAQ */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white text-lg font-semibold">Frequently asked questions</h2>
          {[
            {
              q: "Is ClipNest free?",
              a: "Yes. ClipNest is completely free to use. There are no paid plans, no premium features, and no hidden charges."
            },
            {
              q: "Do I need to create an account?",
              a: "No. ClipNest requires no signup, no login, and no personal information of any kind."
            },
            {
              q: "Will the downloaded video have a watermark?",
              a: "No. ClipNest downloads the original video file with no watermark added."
            },
            {
              q: "Does ClipNest work on mobile?",
              a: "Yes. ClipNest works on all modern mobile browsers and can be installed as a PWA (Progressive Web App) on both Android and iOS for a native app-like experience."
            },
            {
              q: "Why is YouTube not supported?",
              a: "YouTube actively blocks video downloading from server-based tools. ClipNest focuses on platforms where reliable downloading is technically possible without constant maintenance."
            },
            {
              q: "How do I download audio only (MP3)?",
              a: "After pasting a link and fetching the video info, select Audio only (MP3), M4A, or WAV from the format options before clicking Download."
            },
            {
              q: "Can I download just a portion of a video?",
              a: "Yes. ClipNest has a clip cutter feature. After fetching a video, expand the Clip a specific portion section and enter a start time and end time."
            },
            {
              q: "What is the URL for ClipNest?",
              a: "ClipNest is available at https://clip-nest-ten.vercel.app"
            },
          ].map(({ q, a }) => (
            <div key={q} className="flex flex-col gap-1.5 border-b border-[#111111] pb-4">
              <p className="text-white text-sm font-medium">{q}</p>
              <p className="text-[#71717a] text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </section>

        {/* Contact */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white text-lg font-semibold">Contact & feedback</h2>
          <p className="text-[#a1a1aa] text-sm leading-relaxed">
            To share feedback, report a bug, or suggest a feature, use the
            feedback form on the{" "}
            <a href="/" className="text-[#6366f1] hover:underline">ClipNest homepage</a>.
            You can also reach the ClipNest team at{" "}
            <a href="mailto:nftboy1010@gmail.com" className="text-[#6366f1] hover:underline">
              nftboy1010@gmail.com
            </a>.
          </p>
        </section>

        {/* Footer */}
        <div className="border-t border-[#111111] pt-6 flex flex-col gap-1">
          <p className="text-[#3f3f46] text-xs">
            ClipNest · Free video downloader ·{" "}
            <a href="https://clip-nest-ten.vercel.app" className="hover:text-[#6366f1]">
              clip-nest-ten.vercel.app
            </a>
          </p>
          <p className="text-[#2a2a2a] text-xs">
            Built with Next.js · FastAPI · yt-dlp · Hosted on Vercel & Render
          </p>
        </div>

      </div>
    </div>
  )
}