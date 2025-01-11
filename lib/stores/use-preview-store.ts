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
    (set, get) => ({
      html: '',
      css: '',
      editableElements: {},

      updatePreview: (html: string, css: string) => {
        // Extract current editable elements from the new HTML
        const currentElements = get().editableElements
        const updatedElements: Record<string, EditableElement> = {}

        // First find all editable elements in the new HTML
        const editableRegex = /data-editable-id="([^"]+)"[^>]*>([^<]*)</g
        const newElements: Record<string, EditableElement> = {}
        let match

        while ((match = editableRegex.exec(html)) !== null) {
          const [_, id, content] = match
          newElements[id] = { content }
        }

        // Keep manual edits that still exist in the new HTML
        Object.entries(currentElements).forEach(([id, element]) => {
          if (id in newElements) {
            updatedElements[id] = {
              content: element.content,
              styles: element.styles,
            }
            // Update HTML with manual edit and preserve data-editable-id
            const elementRegex = new RegExp(
              `(<[^>]*?data-editable-id="${id}"[^>]*?>)[^<]*(</[^>]*?>)`,
              'g'
            )
            html = html.replace(elementRegex, `$1${element.content}$2`)
          }
        })

        set({ html, css, editableElements: updatedElements })
      },

      updateElement: (id: string, content: string, styles?: { color?: string; fontSize?: string }) => {
        set((state) => {
          // Update editable elements state
          const newEditableElements = {
            ...state.editableElements,
            [id]: {
              content,
              styles: {
                color: styles?.color || '',
                fontSize: styles?.fontSize || 'text-base'
              }
            },
          }

          // Update HTML with new content and styles
          let newHtml = state.html
          const elementRegex = new RegExp(
            `(<[^>]*?data-editable-id="${id}"[^>]*?>)[^<]*(</[^>]*?>)`,
            'g'
          )

          newHtml = newHtml.replace(elementRegex, (match, openTag, closeTag) => {
            // Get existing classes
            const classMatch = openTag.match(/class="([^"]*)"/)
            const existingClasses = classMatch
              ? classMatch[1]
                  .split(' ')
                  .filter((cls: string) => 
                    !cls.startsWith('text-') || 
                    cls.match(/^text-(left|right|center|justify|wrap|nowrap|clip|ellipsis)$/)
                  )
              : []

            // Add new style classes
            const styleClasses = []
            if (styles?.color) styleClasses.push(styles.color)
            if (styles?.fontSize) styleClasses.push(styles.fontSize || 'text-base')

            // Combine classes
            const allClasses = [...existingClasses, ...styleClasses].filter(Boolean)
            const classAttr =
              allClasses.length > 0 ? ` class="${allClasses.join(' ')}"` : ''

            // Create new tag while preserving data-editable-id and other attributes
            const newOpenTag = openTag.includes('class="')
              ? openTag.replace(/class="[^"]*"/, classAttr)
              : openTag.replace(/^(<[^>]+)/, `$1${classAttr}`)

            return `${newOpenTag}${content}${closeTag}`
          })

          return {
            html: newHtml,
            editableElements: newEditableElements,
          }
        })
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
