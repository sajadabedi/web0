'use client'

import { EditOverlay } from '@/components/preview/edit-overlay'
import { LoadingToast } from '@/components/preview/loading-toast'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useChatStore } from '@/lib/hooks/use-chat'
import { usePreviewStore } from '@/lib/stores/use-preview-store'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { Globe, Share2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SitePreviewProps {
  sidebarExpanded?: boolean
}

export function SitePreview({ sidebarExpanded = true }: SitePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { html, css, theme, updateElement } = usePreviewStore()
  const { getCurrentVersion } = useWebsiteVersionStore()
  const { isLoading, currentHtml, currentCss } = useChatStore()
  const [editingState, setEditingState] = useState<{
    id: string
    content: string
    position: { x: number; y: number }
    styles: { fontSize: string; color: string }
  } | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)

  // Only show toast when sidebar is collapsed and there's loading
  const showToast = !sidebarExpanded && isLoading

  useEffect(() => {
    if (!html || !iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument
    if (!doc) return

    // Write the HTML content
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html class="${theme === 'dark' ? 'dark' : ''}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {}
              }
            }
          </script>
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
        const iframeRect = iframe.getBoundingClientRect()

        // Get current styles more accurately
        const classList = Array.from(editableElement.classList)

        // Find font size class
        const fontSize = classList.find((cls) =>
          cls.match(/^text-(sm|base|lg|xl|2xl|3xl)$/)
        )

        // Find color class
        const color = classList.find(
          (cls) =>
            cls.startsWith('text-') &&
            !cls.match(/^text-(sm|base|lg|xl|2xl|3xl)$/) &&
            !cls.match(/^text-(left|right|center|justify|wrap|nowrap|clip|ellipsis)$/)
        )

        setEditingState({
          id,
          content: editableElement.innerText || '',
          position: {
            x: rect.left + iframeRect.left,
            y: rect.top + iframeRect.top,
          },
          styles: {
            fontSize: fontSize || 'text-base',
            color: color || '',
          },
        })
      }
    }

    // Wait for iframe to load before adding event listener
    const handleLoad = () => {
      const body = doc.body
      if (body) {
        body.addEventListener('click', handleClick)
      }
    }

    // Add load event listener
    iframe.addEventListener('load', handleLoad)

    // Cleanup function
    return () => {
      iframe.removeEventListener('load', handleLoad)
      const body = doc.body
      if (body) {
        body.removeEventListener('click', handleClick)
      }
    }
  }, [html, css, theme])

  const handlePublish = async () => {
    const { html, css } = usePreviewStore.getState()
    const { currentHtml, currentCss } = useChatStore.getState()
    
    const rawHtml = html || currentHtml
    if (!rawHtml?.trim()) {
      console.warn('No HTML content to publish')
      toast.error('No content to publish')
      return
    }

    // Create a clean HTML structure
    const contentToPublish = {
      html: rawHtml.trim(),
      css: (css || currentCss || '').trim()
    }

    try {
      setIsPublishing(true)
      
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentToPublish),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to publish')
      }

      const { id } = responseData
      const url = `${window.location.origin}/preview/${id}`
      setPublishedUrl(url)
      
      // Copy URL to clipboard
      await navigator.clipboard.writeText(url)
      
      toast.success('Published! URL copied to clipboard', {
        action: {
          label: 'Open',
          onClick: () => window.open(url, '_blank'),
        },
      })
    } catch (error) {
      console.error('Failed to publish:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to publish')
    } finally {
      setIsPublishing(false)
    }
  }

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
        <Button
          variant="outline"
          size="sm"
          onClick={handlePublish}
          disabled={isPublishing || !html}
        >
          <Share2 className="mr-2 h-4 w-4" />
          {isPublishing ? 'Publishing...' : 'Publish'}
        </Button>
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
