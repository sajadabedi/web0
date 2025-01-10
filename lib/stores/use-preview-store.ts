'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useWebsiteVersionStore } from './use-website-version-store'
import { v4 as uuidv4 } from 'uuid'

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
        // Extract current editable elements from the new HTML
        const currentElements = get().editableElements
        const updatedElements: Record<string, string> = {}
        
        // First find all editable elements in the new HTML
        const editableRegex = /data-editable-id="([^"]+)"[^>]*>([^<]*)</g
        let match
        const newElements: Record<string, string> = {}
        
        while ((match = editableRegex.exec(html)) !== null) {
          const [_, id, content] = match
          newElements[id] = content
        }
        
        // Keep manual edits that still exist in the new HTML
        Object.keys(currentElements).forEach(id => {
          if (id in newElements) {
            updatedElements[id] = currentElements[id]
            // Update HTML with manual edit
            const elementRegex = new RegExp(
              `(data-editable-id="${id}"[^>]*>)[^<]*(</[^>]*>)`,
              'g'
            )
            html = html.replace(elementRegex, `$1${currentElements[id]}$2`)
          }
        })

        set({ html, css, editableElements: updatedElements })
      },

      updateElement: (elementId: string, content: string) => {
        // Update editable elements state
        set((state) => ({
          editableElements: {
            ...state.editableElements,
            [elementId]: content
          }
        }))

        // Get the current version and update HTML
        const versionStore = useWebsiteVersionStore.getState()
        const currentVersion = versionStore.getCurrentVersion()
        if (currentVersion) {
          // Update HTML with new content
          const elementRegex = new RegExp(
            `(data-editable-id="${elementId}"[^>]*>)[^<]*(</[^>]*>)`,
            'g'
          )
          const updatedHtml = get().html.replace(elementRegex, `$1${content}$2`)
          
          // Update preview state
          set({ html: updatedHtml })
          
          // Create a new version for the manual edit with a new messageId
          versionStore.addVersion({
            messageId: uuidv4(), // Generate new messageId for manual edit
            timestamp: Date.now(),
            html: updatedHtml,
            css: currentVersion.css,
            changes: {
              type: 'update',
              description: `Manual edit: Updated text "${elementId}" to "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
              isManualEdit: true
            }
          })
        }
      },

      revertToVersion: (versionId: string) => {
        const versionStore = useWebsiteVersionStore.getState()
        const version = versionStore.versions.find((v) => v.id === versionId)
        if (!version) return

        // Reset editable elements when reverting
        set({
          html: version.html,
          css: version.css,
          editableElements: {}
        })

        versionStore.revertToVersion(versionId)
      }
    }),
    {
      name: 'preview-store',
    }
  )
)
