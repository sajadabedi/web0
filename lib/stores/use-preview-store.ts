"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface PreviewState {
  html: string
  css: string
  updatePreview: (html: string, css: string) => void
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
    }),
    {
      name: 'preview-store',
    }
  )
)
