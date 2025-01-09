'use client'

import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { usePreviewStore } from '../stores/use-preview-store'
import { getMultipleUnsplashImages } from '../utils/unsplash'
import { openai, type Message } from '@/lib/openai-config'

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

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,
      currentHtml: null,
      currentCss: null,
      stopGeneration: () => {
        if (abortController) {
          abortController.abort()
          abortController = null
          set({ isLoading: false })
        }
      },
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

        try {
          set((state) => ({
            messages: [...state.messages, newMessage],
          }))

          const { currentHtml, currentCss } = get()

          // Add current website state to the context if it exists
          const contextMessage = currentHtml
            ? [
                {
                  role: 'system' as const,
                  content: `Current website state:

HTML:
${currentHtml}

CSS:
${currentCss}

Please modify the above website based on the user's request. Only create a new website if explicitly asked.`,
                },
              ]
            : []

          // Add a temporary message while we wait for the response
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

          const response = await openai.chat.completions.create(
            {
              messages: [
                {
                  role: 'system',
                  content: SYSTEM_PROMPT,
                },
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

          let fullMessage = ''

          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || ''
              fullMessage += content
            }
          } catch (error: any) {
            if (error.name === 'AbortError') {
              // Clean up when aborted and return silently
              set((state) => ({
                messages: state.messages.slice(0, -1), // Remove the temporary message
                isLoading: false,
              }))
              return
            }
            throw error
          }

          // Don't proceed with JSON parsing if the message is empty or was aborted
          if (!fullMessage.trim()) {
            set((state) => ({
              messages: state.messages.slice(0, -1), // Remove the temporary message
              isLoading: false,
            }))
            return
          }

          try {
            // Clean up the message to ensure valid JSON
            const cleanMessage = fullMessage.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            const jsonStartIndex = cleanMessage.indexOf('{')
            const jsonEndIndex = cleanMessage.lastIndexOf('}') + 1

            // Only try to parse if we have a complete JSON object
            if (jsonStartIndex === -1 || jsonEndIndex <= jsonStartIndex) {
              set((state) => ({
                messages: state.messages.slice(0, -1), // Remove the temporary message
                isLoading: false,
              }))
              return
            }

            const jsonStr = cleanMessage.slice(jsonStartIndex, jsonEndIndex)

            const parsedResponse = JSON.parse(jsonStr)

            if (!parsedResponse.html || typeof parsedResponse.explanation !== 'string') {
              throw new Error('Invalid response format')
            }

            // Extract all image queries
            const imageRegex = /<unsplash-image query="([^"]+)" alt="([^"]+)" \/>/g
            const matches = [...parsedResponse.html.matchAll(imageRegex)]

            if (matches.length > 0) {
              const queries = matches.map((match) => match[1])
              const alts = matches.map((match) => match[2])

              // Fetch all images
              const images = await getMultipleUnsplashImages(queries)

              // Replace image placeholders with actual images
              let processedHtml = parsedResponse.html
              images.forEach((image, index) => {
                const placeholder = `<unsplash-image query="${queries[index]}" alt="${alts[index]}" />`
                const imgHtml = `<img src="${image.url}" alt="${alts[index]}" class="w-full h-full object-cover" loading="lazy" />`
                processedHtml = processedHtml.replace(placeholder, imgHtml)
              })

              parsedResponse.html = processedHtml
            }

            // Save version before updating preview
            const versionStore = useWebsiteVersionStore.getState()
            const versionId = versionStore.addVersion({
              messageId,
              timestamp: Date.now(),
              html: parsedResponse.html,
              css: parsedResponse.css || '',
              changes: {
                type: versionStore.versions.length === 0 ? 'initial' : 'update',
                description: parsedResponse.explanation,
              },
            })

            // Update the preview store
            const updatePreview = usePreviewStore.getState().updatePreview
            updatePreview(parsedResponse.html, parsedResponse.css || '')

            // Update messages
            set((state) => ({
              messages: [
                ...state.messages.slice(0, -1), // Remove temporary message
                {
                  id: messageId, // Use the same messageId for the assistant message
                  role: 'assistant',
                  content: parsedResponse.explanation,
                  timestamp: new Date(),
                },
              ],
              currentHtml: parsedResponse.html,
              currentCss: parsedResponse.css || '',
              isLoading: false,
            }))
          } catch (e) {
            console.error(
              'Failed to parse OpenAI response:',
              e,
              '\nMessage:',
              fullMessage
            )
            set((state) => ({
              messages: state.messages.slice(0, -1), // Remove the temporary message
              isLoading: false,
            }))
            return
          }
        } catch (error) {
          console.error('Error:', error)
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }
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

      removeMessagesAfter: (messageId: string) => {
        set((state) => {
          const messageIndex = state.messages.findIndex((m) => m.id === messageId)
          if (messageIndex === -1) return state

          return {
            ...state,
            messages: state.messages.slice(0, messageIndex + 1),
          }
        })
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'chat-store',
    }
  )
)
