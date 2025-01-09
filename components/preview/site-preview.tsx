'use client'

import { usePreviewStore } from '@/lib/stores/use-preview-store'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { useEffect, useRef } from 'react'
import { Globe } from 'lucide-react'

export function SitePreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { html, css } = usePreviewStore()
  const { getCurrentVersion } = useWebsiteVersionStore()

  useEffect(() => {
    if (!iframeRef.current) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    // Get the current version if available
    const currentVersion = getCurrentVersion()
    const finalHtml = currentVersion?.html || html
    const finalCss = currentVersion?.css || css

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

            ${finalCss}
          </style>
        </head>
        <body>
          ${finalHtml}
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
            })();
          </script>
        </body>
      </html>
    `

    // Write the content to the iframe
    doc.open()
    doc.write(content)
    doc.close()
  }, [html, css, getCurrentVersion])

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border bg-white dark:bg-neutral-900 relative dark:border-neutral-800 text-gray-600">
      {!html && !css ? (
        <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center text-muted-foreground dark:text-neutral-500 text-sm">
          <Globe className="mr-2 h-4 w-4" />
          Preview will appear here
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
