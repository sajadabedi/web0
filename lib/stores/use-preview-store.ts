'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useWebsiteVersionStore } from './use-website-version-store'

interface EditableElement {
  content: string
  styles?: {
    fontSize?: string
    color?: string
  }
}

type Theme = 'light' | 'dark'

interface ElementStyles {
  fontSize?: string
  color?: string
}

export interface PreviewStore {
  html: string | null
  css: string | null
  theme: 'light' | 'dark'
  editableElements: Record<string, EditableElement>
  updatePreview: (html: string, css: string) => void
  updateElement: (id: string, content: string, styles: ElementStyles) => void
  toggleTheme: () => void
  revertToVersion: (versionId: string) => void
}

// Helper function to convert Tailwind classes to inline styles
function convertTailwindToInline(styles: ElementStyles): string {
  const styleArray: string[] = []

  if (styles.fontSize) {
    const sizeMap: Record<string, string> = {
      'text-xs': '12px',
      'text-sm': '14px',
      'text-base': '16px',
      'text-lg': '18px',
      'text-xl': '20px',
      'text-2xl': '24px',
      'text-3xl': '30px',
      'text-4xl': '36px',
      'text-5xl': '48px',
      'text-6xl': '60px',
    }
    const size = sizeMap[styles.fontSize] || '16px'
    styleArray.push(`font-size: ${size}`)
  }

  if (styles.color) {
    const colorMap: Record<string, string> = {
      'text-red-500': '#ef4444',
      'text-blue-500': '#3b82f6',
      'text-green-500': '#22c55e',
      'text-yellow-500': '#eab308',
      'text-purple-500': '#a855f7',
      'text-pink-500': '#ec4899',
      'text-gray-500': '#6b7280',
      'text-black': '#000000',
      'text-white': '#ffffff',
    }
    const color = colorMap[styles.color] || styles.color.replace('text-', '')
    styleArray.push(`color: ${color}`)
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
            
            // Apply stored styles to the element
            const styles = currentElements[id].styles
            if (styles) {
              const inlineStyles = convertTailwindToInline(styles)
              if (inlineStyles) {
                el.setAttribute('style', inlineStyles)
              }
            }
            
            // Update content
            el.textContent = currentElements[id].content
          }
        })

        set({
          html: tempDiv.innerHTML,
          css: css?.trim() || null,
          editableElements: updatedElements
        })
      },

      updateElement: (id: string, content: string, styles: ElementStyles) => {
        const { html } = get()
        if (!html) return

        // Update the store state first
        set((state) => ({
          editableElements: {
            ...state.editableElements,
            [id]: { content, styles }
          }
        }))

        // Then update the HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = html

        const element = tempDiv.querySelector(`[data-editable-id="${id}"]`)
        if (element) {
          // Update content
          element.textContent = content

          // Apply styles
          const inlineStyles = convertTailwindToInline(styles)
          if (inlineStyles) {
            element.setAttribute('style', inlineStyles)
          }

          // Update the HTML
          set({ html: tempDiv.innerHTML })
        }
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
