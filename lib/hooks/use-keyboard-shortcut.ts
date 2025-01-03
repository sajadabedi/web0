"use client"

import { useEffect } from "react"

export function useKeyboardShortcut(key: string, callback: () => void, metaKey = true) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.metaKey === metaKey
      ) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, callback, metaKey])
}
