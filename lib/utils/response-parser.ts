'use client'

import { processImages } from './image-processor'

// Extract and validate JSON response from OpenAI stream
export async function parseOpenAIResponse(fullMessage: string) {
  const cleanMessage = fullMessage.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
  const jsonStartIndex = cleanMessage.indexOf('{')
  const jsonEndIndex = cleanMessage.lastIndexOf('}') + 1

  if (jsonStartIndex === -1 || jsonEndIndex <= jsonStartIndex) {
    throw new Error('Invalid JSON response')
  }

  const jsonStr = cleanMessage.slice(jsonStartIndex, jsonEndIndex)
  const parsedResponse = JSON.parse(jsonStr)

  if (!parsedResponse.html || typeof parsedResponse.explanation !== 'string') {
    throw new Error('Invalid response format')
  }

  parsedResponse.html = await processImages(parsedResponse.html)
  return parsedResponse
}
