'use client'

import { LoadingToast } from '@/components/preview/loading-toast'
import { EditOverlay } from '@/components/preview/edit-overlay'
import { useChatStore } from '@/lib/hooks/use-chat'
import { usePreviewStore } from '@/lib/stores/use-preview-store'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { makeHtmlEditable, extractEditableContent } from '@/lib/utils/html-parser'
import { Globe } from 'lucide-react'
import { useEffect, useRef, useCallback, useState } from 'react'

interface SitePreviewProps {
  sidebarExpanded?: boolean
}

export function SitePreview({ sidebarExpanded = true }: SitePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { html, css, updateElement } = usePreviewStore()
  const { getCurrentVersion } = useWebsiteVersionStore()
  const { isLoading, currentHtml } = useChatStore()
  const [editingState, setEditingState] = useState<{
    id: string
    content: string
    position: { x: number; y: number }
  } | null>(null)

  // Only show toast when sidebar is collapsed and there's loading
  const showToast = !sidebarExpanded && isLoading

  // Memoize the update function to keep it stable
  const handleUpdateElement = useCallback(
    (id: string, content: string) => {
      updateElement(id, content)
    },
    [updateElement]
  )

  useEffect(() => {
    if (!iframeRef.current) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    // Get the current version if available
    const currentVersion = getCurrentVersion()
    const finalHtml = currentVersion?.html || html
    const finalCss = currentVersion?.css || css

    // Skip if no HTML content
    if (!finalHtml) return

    // Make HTML editable and extract content
    const editableHtml = makeHtmlEditable(finalHtml)
    const editableContent = extractEditableContent(editableHtml)

    // Update store with editable content (only for new elements)
    Object.entries(editableContent).forEach(([id, content]) => {
      if (!usePreviewStore.getState().editableElements[id]) {
        handleUpdateElement(id, content)
      }
    })

    // Create a clean document with sandboxed scripts
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            /* Reset default styles */
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              line-height: 1.5;
              -webkit-font-smoothing: antialiased;
            }

            [data-editable-id] {
              cursor: pointer;
            }

            [data-editable-id]:hover {
              outline: 1px dashed #FF8FE7;
              outline-offset: 2px;
            }

            ${finalCss}
          </style>
        </head>
        <body>
          ${editableHtml}
          <script>
            // Sandbox any scripts in a closure to avoid global scope pollution
            (function() {
              // Initialize Tailwind in an isolated scope
              const tailwindScript = document.createElement('script');
              tailwindScript.src = 'https://cdn.tailwindcss.com';
              tailwindScript.onload = function() {
                window.tailwind.config = {
                  theme: {
                    extend: {
                      fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                      },
                    },
                  },
                };
              };
              document.head.appendChild(tailwindScript);

              // Add click handlers for editable elements
              document.addEventListener('click', (e) => {
                const editableElement = e.target.closest('[data-editable-id]');
                if (editableElement) {
                  const id = editableElement.getAttribute('data-editable-id');
                  const content = editableElement.textContent;
                  window.parent.postMessage({ type: 'startEditing', id, content }, '*');
                }
              });
            })();
          </script>
        </body>
      </html>
    `

    // Write the content to the iframe
    doc.open()
    doc.write(content)
    doc.close()
  }, [html, css, getCurrentVersion, handleUpdateElement])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'startEditing') {
        const { id, content } = event.data

        // Get the position of the element in the iframe
        const doc = iframeRef.current?.contentDocument
        if (!doc) return

        const element = doc.querySelector(`[data-editable-id="${id}"]`)
        if (!element) return

        const rect = element.getBoundingClientRect()
        const iframeRect = iframeRef.current?.getBoundingClientRect()

        if (!iframeRect) return

        // Calculate position relative to the main window
        const position = {
          x: iframeRect.left + rect.left,
          y: iframeRect.top + rect.top,
        }

        setEditingState({ id, content, position })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Add scroll handler to close edit overlay
  useEffect(() => {
    if (!editingState) return

    const doc = iframeRef.current?.contentDocument
    if (!doc) return

    const handleScroll = () => {
      setEditingState(null)
    }

    // Listen for scroll in both iframe and window
    doc.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      doc.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [editingState])

  const handleSave = useCallback(
    (content: string) => {
      if (!editingState) return

      // Update the content in the store
      updateElement(editingState.id, content)

      // Update the content in the iframe
      const doc = iframeRef.current?.contentDocument
      if (!doc) return

      const element = doc.querySelector(`[data-editable-id="${editingState.id}"]`)
      if (!element) return

      element.textContent = content
      setEditingState(null)
    },
    [editingState, updateElement]
  )

  return (
    <div className="relative w-full h-full p-2">
      <LoadingToast
        isLoading={showToast}
        message={currentHtml ? 'Making changes...' : 'Creating your website...'}
      />
      <div className="h-full w-full rounded-lg overflow-hidden bg-white dark:bg-neutral-900 relative text-gray-600 shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_1px_4px_rgba(255,255,255,0.1)]">
        {!html && !css ? (
          <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center text-muted-foreground dark:text-neutral-500 text-sm">
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
          onSave={handleSave}
          onCancel={() => setEditingState(null)}
        />
      )}
    </div>
  )
}
