'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useWebsiteVersionStore } from './use-website-version-store'

export interface EditableStyles {
  fontSize?: string
  color?: string
}

export interface EditableElement {
  content: string
  styles?: EditableStyles
}

export interface PreviewStore {
  html: string | null
  css: string | null
  theme: 'light' | 'dark'
  editableElements: Record<string, EditableElement>
  updatePreview: (html: string, css: string) => void
  updateElement: (id: string, content: string, styles: EditableStyles) => void
  toggleTheme: () => void
  revertToVersion: (versionId: string) => void
}

function convertTailwindToInline(styles: EditableStyles): string {
  const styleArray: string[] = []
  
  if (styles.fontSize) {
    styleArray.push(`font-size: ${styles.fontSize}`)
  }
  if (styles.color) {
    styleArray.push(`color: ${styles.color}`)
  }
  
  return styleArray.join('; ')
}

export const usePreviewStore = create<PreviewStore>()(
  devtools(
    (set, get) => ({
      html: null,
      css: null,
      theme: 'light',
      editableElements: {},

      updatePreview: (html: string, css: string) => {
        if (!html) {
          console.warn('Received empty HTML in updatePreview')
          return
        }

        // Extract current editable elements from the new HTML
        const currentElements = get().editableElements
        const updatedElements: Record<string, EditableElement> = {}

        // First find all editable elements in the new HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = html

        // Find all editable elements and preserve their current state
        tempDiv.querySelectorAll('[data-editable-id]').forEach((el) => {
          const id = el.getAttribute('data-editable-id')
          if (id && id in currentElements) {
            updatedElements[id] = currentElements[id]
            el.textContent = currentElements[id].content
          }
        })

        set({
          html: tempDiv.innerHTML,
          css: css?.trim() || null,
          editableElements: updatedElements
        })
      },

      updateElement: (id: string, content: string, styles: EditableStyles) => {
        set((state) => ({
          editableElements: {
            ...state.editableElements,
            [id]: { content, styles }
          }
        }))
      },

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }))
      },

      revertToVersion: (versionId: string) => {
        const version = useWebsiteVersionStore.getState().versions.find(v => v.id === versionId)
        if (version) {
          set({ html: version.html, css: version.css, editableElements: {} })
        }
      },
    }),
    { name: 'preview-store' }
  )
)
