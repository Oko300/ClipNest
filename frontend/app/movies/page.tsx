"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

const GENRES = ["Any", "Action", "Drama", "Documentary", "Comedy", "Horror", "Sci-Fi", "Educational"]
const FOCUS = ["Any", "Classic / Public Domain", "Independent", "Documentary", "Educational"]

interface MovieResult {
  identifier: string
  title: string
  year: string
  description: string
  thumbnail: string
  source: string
  downloads: number
}

export default function MovieGallery() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [genre, setGenre] = useState("Any")
  const [focus, setFocus] = useState("Any")
  const [results, setResults] = useState<MovieResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError("")
    setSearched(true)

    try {
      let searchQuery = query
      if (genre !== "Any") searchQuery += ` ${genre}`
      if (focus !== "Any" && focus !== "Classic / Public Domain") searchQuery += ` ${focus}`

      const mediatype = "movies"
      const collection = focus === "Classic / Public Domain" ? "feature_films" : "movies"

      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(searchQuery)}+mediatype:${mediatype}&fl[]=identifier,title,year,description,downloads&sort[]=downloads+desc&rows=12&output=json`

      const res = await fetch(url)
      const data = await res.json()

      const movies: MovieResult[] = (data.response?.docs || []).map((doc: any) => ({
        identifier: doc.identifier,
        title: doc.title || "Untitled",
        year: doc.year || "Unknown",
        description: doc.description || "",
        thumbnail: `https://archive.org/services/img/${doc.identifier}`,
        source: "Internet Archive",
        downloads: doc.downloads || 0,
      }))

      setResults(movies)
    } catch (e) {
      setError("Search failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (identifier: string) => {
    const url = `https://archive.org/download/${identifier}`
    router.push(`/?url=${encodeURIComponent(url)}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[680px] mx-auto px-4 pt-12 pb-24 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")}
            className="text-[#52525b] text-sm hover:text-white transition-colors">
            ← Back
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">🎬 Movie Gallery</h1>
            <p className="text-[#52525b] text-xs">Free & legal public domain films</p>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[#a1a1aa] text-xs font-medium mb-1">
            ℹ️ About copyright & new releases
          </p>
          <p className="text-[#52525b] text-xs leading-relaxed">
            Commercial movies from Hollywood, Bollywood, and Nollywood remain
            under copyright for 50–95 years after release. ClipNest Movie Gallery
            only shows films that are already free and legal to download —
            public domain, Creative Commons, or explicitly free uploads.
            Recent box-office movies will not appear here.
          </p>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search for a film, documentary, classic movie..."
            className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-3 text-[#f5f5f5] text-sm placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1]"
          />
          <div className="flex gap-2">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="flex-1 bg-[#111111] border border-[#1f1f1f] rounded-xl px-3 py-2 text-[#a1a1aa] text-xs focus:outline-none focus:border-[#6366f1]"
            >
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="flex-1 bg-[#111111] border border-[#1f1f1f] rounded-xl px-3 py-2 text-[#a1a1aa] text-xs focus:outline-none focus:border-[#6366f1]"
            >
              {FOCUS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <button
            onClick={search}
            disabled={loading}
            className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            {loading ? "Searching..." : "Search Films"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[#ef4444] text-sm text-center">{error}</p>
        )}

        {/* Results */}
        {searched && !loading && results.length === 0 && !error && (
          <div className="text-center py-10">
            <p className="text-[#52525b] text-sm">No films found. Try a different search.</p>
            <p className="text-[#3f3f46] text-xs mt-1">
              Tip: Try "charlie chaplin", "documentary", "1920s film"
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-[#52525b] text-xs">
              {results.length} films found from Internet Archive
            </p>
            {results.map((movie) => (
              <div key={movie.identifier}
                className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
                <div className="flex gap-3 p-3">
                  <img
                    src={movie.thumbnail}
                    alt={movie.title}
                    className="w-20 h-14 object-cover rounded-lg bg-[#1f1f1f] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = ""
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-tight truncate">
                      {movie.title}
                    </p>
                    <p className="text-[#52525b] text-xs mt-0.5">
                      {movie.year} · {movie.source}
                    </p>
                    {movie.description && (
                      <p className="text-[#71717a] text-xs mt-1 line-clamp-2 leading-relaxed">
                        {typeof movie.description === "string"
                          ? movie.description.replace(/<[^>]*>/g, "").slice(0, 120)
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 px-3 pb-3">
                  <a
                    href={`https://archive.org/details/${movie.identifier}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#1f1f1f] text-[#a1a1aa] text-xs font-medium py-2 rounded-lg text-center hover:bg-[#262626] transition-colors"
                  >
                    Preview
                  </a>
                  <button
                    onClick={() => handleDownload(movie.identifier)}
                    className="flex-1 bg-[#6366f1] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#5558e3] transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}