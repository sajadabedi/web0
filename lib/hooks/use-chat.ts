'use client'

import { openai, type Message } from '@/lib/openai-config'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { usePreviewStore } from '../stores/use-preview-store'
import { makeHtmlEditable, preserveEditableContent } from '../utils/html-parser'
import { getMultipleUnsplashImages } from '../utils/unsplash'

interface ChatStore {
  messages: Message[]
  isLoading: boolean
  error: string | null
  currentHtml: string | null
  currentCss: string | null
  sendMessage: (content: string) => Promise<void>
  setError: (error: string | null) => void
  removeMessagesAfter: (messageId: string) => void
  stopGeneration: () => void
}

let abortController: AbortController | null = null

// Main chat store with website generation functionality
export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,
      currentHtml: null,
      currentCss: null,

      // Stop website generation
      stopGeneration: () => {
        if (abortController) {
          abortController.abort()
          abortController = null
          set({ isLoading: false })
        }
      },

      setError: (error) => set({ error }),

      removeMessagesAfter: (messageId: string) => {
        set((state) => {
          const messageIndex = state.messages.findIndex((m) => m.id === messageId)
          if (messageIndex === -1) return state
          return { ...state, messages: state.messages.slice(0, messageIndex + 1) }
        })
      },

      // Send a new message and generate website
      sendMessage: async (content: string) => {
        try {
          const previewStore = usePreviewStore.getState()
          set({ isLoading: true, error: null })

          if (abortController) {
            abortController.abort()
          }
          abortController = new AbortController()

          const messageId = uuidv4()
          const newMessage: Message = {
            id: messageId,
            role: 'user',
            content,
            timestamp: new Date(),
          }

          set((state) => ({ messages: [...state.messages, newMessage] }))

          // Get current state from preview store
          const { html, css, editableElements } = previewStore

          // Format editable elements for context
          const editableContext = Object.entries(editableElements)
            .map(([id, content]) => `data-editable-id="${id}": "${content}"`)
            .join('\n')

          // Create context message
          const contextMessage = html
            ? [
                {
                  role: 'system' as const,
                  content: `Current website state:

HTML:
${html}

CSS:
${css}

Editable elements:
${editableContext}

Instructions:
1. Keep all data-editable-id attributes intact
2. Do not modify the content of elements with data-editable-id
3. Keep existing styles for elements with data-editable-id
4. Preserve the structure around editable elements
5. Make your changes around the manual edits, treating them as fixed points
6. If you need to add content near manual edits, do so carefully without disturbing them
7. Return the complete HTML with your changes while keeping manual edits intact`,
                },
              ]
            : []

          // Add loading message
          set((state) => ({
            messages: [
              ...state.messages,
              {
                id: uuidv4(),
                role: 'assistant',
                content: html ? 'Modifying your website...' : 'Creating your website...',
                timestamp: new Date(),
              },
            ],
          }))

          try {
            // Generate website with OpenAI
            const response = await openai.chat.completions.create(
              {
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  ...contextMessage,
                  ...get().messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                  })),
                  { role: 'user', content },
                ],
                model: process.env.NEXT_PUBLIC_GPT || 'gpt-4',
                temperature: 0.7,
                stream: true,
              },
              { signal: abortController.signal }
            )

            // Collect streamed response
            let fullMessage = ''
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || ''
              fullMessage += content
            }

            // Process response and update website
            const parsedResponse = await parseOpenAIResponse(fullMessage)
            console.log('Parsed response:', parsedResponse)

            if (!parsedResponse.html) {
              throw new Error('No HTML content in response')
            }

            // Make HTML editable and preserve manual edits
            const editableHtml = makeHtmlEditable(parsedResponse.html)
            const editableContents = Object.fromEntries(
              Object.entries(editableElements).map(([key, element]) => [
                key,
                element.content,
              ])
            )
            const finalHtml = preserveEditableContent(editableHtml, editableContents)

            // Add new version
            const versionStore = useWebsiteVersionStore.getState()
            versionStore.addVersion({
              messageId,
              timestamp: Date.now(),
              html: finalHtml,
              css: parsedResponse.css || '',
              changes: {
                type: versionStore.versions.length === 0 ? 'initial' : 'update',
                description: parsedResponse.explanation,
              },
            })

            // Update chat store first
            set((state) => ({
              messages: [
                ...state.messages.slice(0, -1),
                {
                  id: messageId,
                  role: 'assistant',
                  content: parsedResponse.explanation,
                  timestamp: new Date(),
                },
              ],
              currentHtml: finalHtml,
              currentCss: parsedResponse.css || '',
              isLoading: false,
            }))

            // Then update preview store
            console.log('Updating preview store with:', {
              html: finalHtml,
              css: parsedResponse.css,
            })
            previewStore.updatePreview(finalHtml, parsedResponse.css || '')
          } catch (error) {
            console.error('Failed to parse response:', error)
            set((state) => ({
              messages: [
                ...state.messages.slice(0, -1),
                {
                  id: messageId,
                  role: 'assistant',
                  content: 'Failed to generate website. Please try again.',
                  timestamp: new Date(),
                },
              ],
              error: 'Failed to generate website',
            }))
          }
        } catch (error) {
          console.error('Failed to send message:', error)
          set({ error: 'Failed to generate website' })
        } finally {
          set({ isLoading: false })
          abortController = null
        }
      },
    }),
    {
      name: 'chat-store',
    }
  )
)

// Replace Unsplash image placeholders with actual images
async function processImages(html: string) {
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
    const imgHtml = `<img src="${image.url}" alt="${alts[index]}" class="w-full object-cover max-h-[240px]" loading="lazy" />`
    processedHtml = processedHtml.replace(placeholder, imgHtml)
  })

  return processedHtml
}

// Extract and validate JSON response from OpenAI stream
async function parseOpenAIResponse(fullMessage: string) {
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
