'use client'

import { getMultipleUnsplashImages } from './unsplash'

// Replace Unsplash image placeholders with actual images
export async function processImages(html: string) {
  // Regular expression to match Unsplash image placeholders
  const imageRegex = /<unsplash-image query="([^"]+)" alt="([^"]+)" \/>/g
  const matches = [...html.matchAll(imageRegex)]

  // If no matches, return original HTML
  if (matches.length === 0) return html

  const queries = matches.map((match) => match[1])
  const alts = matches.map((match) => match[2])
  const images = await getMultipleUnsplashImages(queries)

  let processedHtml = html
  images.forEach((image, index) => {
    const placeholder = `<unsplash-image query="${queries[index]}" alt="${alts[index]}" />`
    const imgHtml = `<img src="${image.url}" alt="${alts[index]}" class="w-full object-cover max-h-80" loading="lazy" />`
    processedHtml = processedHtml.replace(placeholder, imgHtml)
  })

  return processedHtml
}
