'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useWebsiteVersionStore } from './use-website-version-store'

interface EditableElement {
  content: string
  styles?: {
    color?: string
    fontSize?: string
  }
}

interface PreviewState {
  html: string
  css: string
  editableElements: Record<string, EditableElement>
  updatePreview: (html: string, css: string) => void
  revertToVersion: (versionId: string) => void
  updateElement: (
    elementId: string,
    content: string,
    styles?: { color?: string; fontSize?: string }
  ) => void
}

export const usePreviewStore = create<PreviewState>()(
  devtools(
    (set) => ({
      html: '',
      css: '',
      editableElements: {},

      updatePreview: (html: string, css: string) => {
        set({ html, css, editableElements: {} })
      },

      updateElement: (
        id: string,
        content: string,
        styles?: { color?: string; fontSize?: string }
      ) => {
        set((state) => {
          // Update editable elements state
          const newEditableElements = {
            ...state.editableElements,
            [id]: {
              content,
              styles,
            },
          }

          // Update HTML with new content and styles
          let newHtml = state.html
          const elementRegex = new RegExp(
            `<([^>]+)data-editable-id="${id}"[^>]*>([^<]*)</`,
            'g'
          )

          newHtml = newHtml.replace(elementRegex, (match, tag, oldContent) => {
            // Get existing classes
            const classMatch = tag.match(/class="([^"]*)"/)
            const existingClasses = classMatch
              ? classMatch[1].split(' ').filter((cls: string) => !cls.startsWith('text-'))
              : []

            // Add new style classes
            const styleClasses = []
            if (styles?.color) styleClasses.push(styles.color)
            if (styles?.fontSize) styleClasses.push(styles.fontSize)

            // Combine classes
            const allClasses = [...existingClasses, ...styleClasses].filter(Boolean)
            const classAttr =
              allClasses.length > 0 ? ` class="${allClasses.join(' ')}"` : ''

            // Create new tag
            const newTag = tag.includes('class="')
              ? tag.replace(/class="[^"]*"/, classAttr)
              : tag + classAttr

            return `<${newTag}>${content}</`
          })

          return {
            html: newHtml,
            editableElements: newEditableElements,
          }
        })
      },

      revertToVersion: (versionId: string) => {
        const versionStore = useWebsiteVersionStore.getState()
        const version = versionStore.versions.find((v) => v.id === versionId)
        if (!version) return
        set({ html: version.html, css: version.css, editableElements: {} })
      },
    }),
    {
      name: 'preview-store',
    }
  )
)
