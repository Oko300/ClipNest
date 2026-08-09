"use client"
import { useEffect } from "react"

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")

        // Check for updates every time the page loads
        registration.update()

        // When a new service worker is waiting, activate it immediately
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available — reload all tabs automatically
              newWorker.postMessage({ type: "SKIP_WAITING" })
              window.location.reload()
            }
          })
        })
      } catch (err) {
        console.error("SW registration failed:", err)
      }
    }

    registerSW()

    // Also listen for controller change and reload
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload()
    })
  }, [])

  return null
}