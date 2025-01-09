'use client'

import OpenAI from 'openai'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { usePreviewStore } from '../stores/use-preview-store'
import { getMultipleUnsplashImages } from '../utils/unsplash'
import { v4 as uuidv4 } from 'uuid'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatStore {
  messages: Message[]
  isLoading: boolean
  error: string | null
  currentHtml: string | null
  currentCss: string | null
  sendMessage: (content: string) => Promise<void>
  setError: (error: string | null) => void
  removeMessagesAfter: (messageId: string) => void
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

const SYSTEM_PROMPT = `You are an expert web developer who specializes in creating and modifying websites using Tailwind CSS.

When MODIFYING an existing website:
1. Only apply the specific changes requested by the user
2. Keep all other elements and styling exactly as they are
3. Preserve the overall structure and layout
4. Return the ENTIRE HTML with only the requested changes
5. If asked to change text, only update that specific text
6. If asked to change colors, only update those specific color classes
7. If asked to change layout, try to minimize changes to surrounding elements

When CREATING a new website:
1. Focus on modern, clean, and professional design
2. Ensure responsive design works on all screen sizes
3. Follow accessibility best practices (WCAG)
4. Use semantic HTML elements
5. Use Tailwind CSS classes for ALL styling
6. Include proper viewport meta tags and content structure
7. Include images in appropriate sections

For images, ALWAYS use this format:
<unsplash-image query="SEARCH_TERMS" alt="DESCRIPTIVE_ALT_TEXT" />

ALWAYS respond in this exact JSON format:
{
  "html": "<The complete HTML code>",
  "css": "",
  "explanation": "Brief explanation of what was changed or created"
}

Tailwind Guidelines:
- Use proper spacing utilities (p-4, m-2, etc.)
- Use flex and grid utilities for layout
- Use proper text utilities for typography
- Common patterns:
  - Container: container mx-auto px-4
  - Flex layout: flex items-center justify-between
  - Grid layout: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
  - Spacing: space-y-4 gap-8 p-4 my-8

Example of targeted changes:
1. "Change the heading to 'Welcome'"
   - Only update the text content of that specific heading
   - Keep all classes and surrounding elements unchanged

2. "Make the button blue"
   - Only update the color classes on that specific button
   - Keep all other classes and attributes unchanged

3. "Add a new section below the hero"
   - Keep the hero section exactly as is
   - Insert the new section after it
   - Keep all other sections unchanged`

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,
      currentHtml: null,
      currentCss: null,

      sendMessage: async (content: string) => {
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

          const response = await openai.chat.completions.create({
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
          })

          const message = response.choices[0].message.content

          if (!message) {
            throw new Error('No response from OpenAI')
          }

          try {
            // Clean up the message to ensure valid JSON
            const cleanMessage = message.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            const jsonStartIndex = cleanMessage.indexOf('{')
            const jsonEndIndex = cleanMessage.lastIndexOf('}') + 1
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
            console.error('Failed to parse OpenAI response:', e, '\nMessage:', message)
            set((state) => ({
              messages: [
                ...state.messages.slice(0, -1), // Remove temporary message
                {
                  id: uuidv4(),
                  role: 'assistant',
                  content:
                    'Sorry, I encountered an error while processing the response. Please try again.',
                  timestamp: new Date(),
                },
              ],
              isLoading: false,
              error: 'Failed to process response',
            }))
          }
        } catch (error) {
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
