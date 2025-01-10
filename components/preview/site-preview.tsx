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
    styles: { fontSize: string; color: string }
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
              outline: 1px dashed transparent;
              transition: outline-color 0.2s;
            }
            [data-editable-id]:hover {
              outline-color: rgba(244, 114, 182, 0.5);
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
                  const text = editableElement.innerText || '';
                  const rect = editableElement.getBoundingClientRect();
                  window.parent.postMessage({
                    type: 'elementClick',
                    id,
                    content: text,
                    rect: {
                      x: rect.left,
                      y: rect.top,
                      width: rect.width,
                      height: rect.height
                    }
                  }, '*');
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

  const handleIframeLoad = () => {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentDocument) return

    // Inject script into iframe
    const script = iframe.contentDocument.createElement('script')
    script.textContent = `
      document.addEventListener('click', (e) => {
        const editableElement = e.target.closest('[data-editable-id]')
        if (editableElement) {
          const id = editableElement.getAttribute('data-editable-id')
          const text = editableElement.innerText || ''
          const rect = editableElement.getBoundingClientRect()
          
          window.parent.postMessage({
            type: 'elementClick',
            id,
            content: text,
            rect: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height
            }
          }, '*')
        }
      })
    `
    iframe.contentDocument.head.appendChild(script)
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementClick') {
        const iframe = iframeRef.current
        if (!iframe) return

        const doc = iframe.contentDocument
        if (!doc) return

        const element = doc.querySelector(`[data-editable-id="${event.data.id}"]`) as HTMLElement
        if (!element) return

        // Get current styles
        const classList = Array.from(element.classList)
        const fontSize = classList.find(cls => cls.match(/^text-(sm|base|lg|xl|2xl|3xl)$/)) || 'text-base'
        const color = classList.find(cls => cls.startsWith('text-') && !cls.match(/^text-(sm|base|lg|xl|2xl|3xl)$/)) || ''

        const iframeRect = iframe.getBoundingClientRect()
        const rect = event.data.rect

        setEditingState({
          id: event.data.id,
          content: event.data.content,
          position: {
            x: rect.x + iframeRect.left,
            y: rect.y + iframeRect.top
          },
          styles: { fontSize, color }
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSave = useCallback(
    (content: string, styles: { color: string; fontSize: string }) => {
      const doc = iframeRef.current?.contentDocument
      if (!doc) return

      const element = doc.querySelector(`[data-editable-id="${editingState?.id}"]`) as HTMLElement
      if (!element) return

      // Update content
      element.innerText = content

      // Update styles
      element.className = element.className
        .split(' ')
        .filter(cls => !cls.startsWith('text-'))
        .concat([styles.color, styles.fontSize].filter(Boolean))
        .join(' ')

      setEditingState(null)
    },
    [editingState]
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
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>${css}</style>
                  <style>
                    [data-editable-id] {
                      cursor: pointer;
                      outline: 1px dashed transparent;
                      transition: outline-color 0.2s;
                    }
                    [data-editable-id]:hover {
                      outline-color: rgba(244, 114, 182, 0.5);
                    }
                  </style>
                </head>
                <body>${html}</body>
              </html>
            `}
            ref={iframeRef}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
            onLoad={handleIframeLoad}
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
