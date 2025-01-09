'use client'

import { openai, type Message } from '@/lib/openai-config'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { usePreviewStore } from '../stores/use-preview-store'
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

        set({ isLoading: true, error: null })
        set((state) => ({ messages: [...state.messages, newMessage] }))

        // Prepare context for OpenAI
        const { currentHtml, currentCss } = get()
        const contextMessage = currentHtml
          ? [
              {
                role: 'system' as const,
                content: `Current website state:\n\nHTML:\n${currentHtml}\n\nCSS:\n${currentCss}\n\nPlease modify the above website based on the user's request. Only create a new website if explicitly asked.`,
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
              content: currentHtml
                ? 'Modifying your website...'
                : 'Creating your website...',
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

          const versionStore = useWebsiteVersionStore.getState()
          versionStore.addVersion({
            messageId,
            timestamp: Date.now(),
            html: parsedResponse.html,
            css: parsedResponse.css || '',
            changes: {
              type: versionStore.versions.length === 0 ? 'initial' : 'update',
              description: parsedResponse.explanation,
            },
          })

          usePreviewStore
            .getState()
            .updatePreview(parsedResponse.html, parsedResponse.css || '')

          // Update chat with response
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
            currentHtml: parsedResponse.html,
            currentCss: parsedResponse.css || '',
            isLoading: false,
          }))
        } catch (error: any) {
          // Handle generation interruption
          if (error.name === 'AbortError') {
            set((state) => ({
              messages: state.messages.slice(0, -1),
              isLoading: false,
            }))
            return
          }

          // Handle other errors
          console.error('Error:', error)
          set((state) => ({
            messages: [
              ...state.messages,
              {
                id: uuidv4(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
              },
            ],
            error: 'Failed to generate website',
            isLoading: false,
          }))
        } finally {
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
    const imgHtml = `<img src="${image.url}" alt="${alts[index]}" class="w-full h-full object-cover" loading="lazy" />`
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
