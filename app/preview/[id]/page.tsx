'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function PreviewPage() {
  const params = useParams()
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    async function fetchPreview() {
      try {
        const response = await fetch(`/api/preview/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch preview')
        }
        const data = await response.json()
        setHtml(data.html)
        setCss(data.css)
      } catch (error) {
        console.error('Error fetching preview:', error)
      }
    }

    if (params.id) {
      fetchPreview()
    }
  }, [params.id])

  if (!html) {
    return <div>Loading...</div>
  }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{__html: `
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {}
            }
          }
        `}} />
        <style dangerouslySetInnerHTML={{__html: `
          /* Reset margins and padding */
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
          }

          /* Custom styles */
          ${css}
        `}} />
      </head>
      <body className={theme === 'dark' ? 'dark' : ''}>
        <div 
          id="preview-content"
          className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      </body>
    </html>
  )
}
