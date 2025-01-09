"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { useWebsiteVersionStore } from "./use-website-version-store"

interface PreviewState {
  html: string
  css: string
  updatePreview: (html: string, css: string) => void
  revertToVersion: (versionId: string) => void
}

export const usePreviewStore = create<PreviewState>()(
  devtools(
    (set) => ({
      html: "",
      css: "",

      updatePreview: (html: string, css: string) => {
        console.log('Preview store update:', { htmlLength: html.length, cssLength: css.length })
        set({ html, css })
      },

      revertToVersion: (versionId: string) => {
        const versionStore = useWebsiteVersionStore.getState()
        const version = versionStore.versions.find(v => v.id === versionId)
        if (!version) return

        // Update both version store and preview store
        versionStore.revertToVersion(versionId)
        set({
          html: version.html,
          css: version.css
        })
      },
    }),
    {
      name: 'preview-store',
    }
  )
)
