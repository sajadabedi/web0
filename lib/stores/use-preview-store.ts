'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useWebsiteVersionStore } from './use-website-version-store'

interface PreviewState {
  html: string
  css: string
  editableElements: Record<string, string>
  updatePreview: (html: string, css: string) => void
  revertToVersion: (versionId: string) => void
  updateElement: (elementId: string, content: string) => void
}

export const usePreviewStore = create<PreviewState>()(
  devtools(
    (set, get) => ({
      html: '',
      css: '',
      editableElements: {},

      updatePreview: (html: string, css: string) => {
        console.log('Preview store update:', { htmlLength: html.length, cssLength: css.length })
        set({ html, css, editableElements: {} })
      },

      updateElement: (elementId: string, content: string) => {
        set((state) => ({
          editableElements: {
            ...state.editableElements,
            [elementId]: content
          }
        }))

        // Get the current version and update it with the new content
        const versionStore = useWebsiteVersionStore.getState()
        const currentVersion = versionStore.getCurrentVersion()
        if (currentVersion) {
          const updatedHtml = get().html.replace(
            new RegExp(`data-editable-id="${elementId}"[^>]*>([^<]*)</`, 'g'),
            (match, oldContent) => match.replace(oldContent, content)
          )
          set({ html: updatedHtml })
          
          // Create a new version for the update
          versionStore.addVersion({
            messageId: currentVersion.messageId,
            timestamp: Date.now(),
            html: updatedHtml,
            css: currentVersion.css,
            changes: {
              type: 'update',
              description: `Updated content for element ${elementId}`
            }
          })
        }
      },

      revertToVersion: (versionId: string) => {
        const versionStore = useWebsiteVersionStore.getState()
        const version = versionStore.versions.find(v => v.id === versionId)
        if (!version) return

        // Update both version store and preview store
        versionStore.revertToVersion(versionId)
        set({
          html: version.html,
          css: version.css,
          editableElements: {}
        })
      },
    }),
    {
      name: 'preview-store',
    }
  )
)
