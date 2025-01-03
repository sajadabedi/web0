"use client"

import { usePreviewStore } from "@/lib/stores/use-preview-store"
import { useEffect, useRef } from "react"

export function SitePreview() {
  const { html, css } = usePreviewStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    // Add default styles and meta tags
    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Reset default styles */
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
              -webkit-font-smoothing: antialiased;
            }

            /* Custom styles */
            ${css}
          </style>
        </head>
        <body>${html}</body>
      </html>
    `)
    doc.close()
  }, [html, css])

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border bg-white relative">
      {!html && !css ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          Describe the website you want to build in the chat
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          title="Website Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      )}
    </div>
  )
}
