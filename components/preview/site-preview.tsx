'use client'

import { EditOverlay } from '@/components/preview/edit-overlay'
import { LoadingToast } from '@/components/preview/loading-toast'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useChatStore } from '@/lib/hooks/use-chat'
import { usePreviewStore } from '@/lib/stores/use-preview-store'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { Globe } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface SitePreviewProps {
  sidebarExpanded?: boolean
}

export function SitePreview({ sidebarExpanded = true }: SitePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { html, css, theme, updateElement } = usePreviewStore()
  const { getCurrentVersion } = useWebsiteVersionStore()
  const { isLoading, currentHtml } = useChatStore()
  const [editingState, setEditingState] = useState<{
    id: string
    content: string
    position: { x: number; y: number }
    styles: { fontSize: string; color: string }
  } | null>(null)

  // Only show toast when sidebar is collapsed and there's loading
  const showToast = !sidebarExpanded && isLoading

  useEffect(() => {
    if (!html || !iframeRef.current) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    // Write the HTML content
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html class="${theme === 'dark' ? 'dark' : ''}">
        <head>
          <style>
            :root {
              color-scheme: light dark;
            }

            body {
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
              color: #000000;
            }

            .dark body {
              background-color: #171717;
              color: #ffffff;
            }

            [data-editable-id] {
              cursor: pointer;
              outline: 1px dashed transparent;
              transition: outline-color 0.2s;
            }
            [data-editable-id]:hover {
              outline-color: rgba(244, 114, 182, 0.5);
            }

            ${css}
          </style>
        </head>
        <body>${html}</body>
      </html>
    `)
    doc.close()

    // Add click handler to document and use event delegation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const editableElement = target.closest('[data-editable-id]') as HTMLElement
      if (editableElement) {
        const id = editableElement.getAttribute('data-editable-id')
        if (!id) return

        const rect = editableElement.getBoundingClientRect()
        const iframeRect = iframeRef.current?.getBoundingClientRect()
        if (!iframeRect) return

        // Get current styles more accurately
        const classList = Array.from(editableElement.classList)

        // Find font size class
        const fontSize = classList.find((cls) =>
          cls.match(/^text-(sm|base|lg|xl|2xl|3xl)$/)
        )

        // Find color class - exclude font size classes and other text-related classes
        const color = classList.find(
          (cls) =>
            cls.startsWith('text-') &&
            !cls.match(/^text-(sm|base|lg|xl|2xl|3xl)$/) &&
            !cls.match(/^text-(left|right|center|justify|wrap|nowrap|clip|ellipsis)$/)
        )

        // Get current element from store to merge with any existing styles
        const currentElement = usePreviewStore.getState().editableElements[id]
        const currentStyles = currentElement?.styles || {}

        setEditingState({
          id,
          content: editableElement.innerText || '',
          position: {
            x: rect.left + iframeRect.left,
            y: rect.top + iframeRect.top,
          },
          styles: {
            fontSize: fontSize || currentStyles.fontSize || 'text-base',
            color: color || currentStyles.color || '',
          },
        })
      }
    }

    // Use event delegation on document body
    doc.body.addEventListener('click', handleClick)
    return () => doc.body.removeEventListener('click', handleClick)
  }, [html, css, theme])

  const handleSave = useCallback(
    (content: string, styles: { color: string; fontSize: string }) => {
      const doc = iframeRef.current?.contentDocument
      if (!doc || !editingState) return

      const element = doc.querySelector(
        `[data-editable-id="${editingState.id}"]`
      ) as HTMLElement
      if (!element) return

      // Update content and styles in the store
      updateElement(editingState.id, content, styles)

      // Close edit overlay
      setEditingState(null)
    },
    [editingState, updateElement]
  )

  return (
    <div className="relative w-full h-screen p-2">
      <div className="flex items-center justify-between mb-2">
        <ThemeToggle />
        <button>Publish</button>
      </div>
      <LoadingToast
        isLoading={showToast}
        message={currentHtml ? 'Making changes...' : 'Creating your website...'}
      />
      <div className="h-[calc(100%-45px)] w-full rounded-lg overflow-hidden bg-white dark:bg-neutral-900 relative text-neutral-600 dark:text-neutral-400 shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_1px_4px_rgba(255,255,255,0.1)]">
        {!html && !css ? (
          <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center text-neutral-500 dark:text-neutral-400 text-sm">
            <Globe className="mr-2 h-4 w-4" />
            Preview will appear here
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
      {editingState && (
        <EditOverlay
          elementId={editingState.id}
          initialContent={editingState.content}
          position={editingState.position}
          initialStyles={editingState.styles}
          onSave={handleSave}
          onCancel={() => setEditingState(null)}
        />
      )}
    </div>
  )
}
