'use client'

import OpenAI from 'openai'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { usePreviewStore } from '../stores/use-preview-store'

interface Message {
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
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

const SYSTEM_PROMPT = `You are a specialized website builder AI that creates and modifies modern, beautiful websites using Tailwind CSS. Your purpose is to either create new websites or modify existing ones based on user requests.

IMPORTANT RULES:
1. If the user asks for a new website or this is the first request, create a fresh website
2. For all other requests, modify the existing website based on the user's requests
3. ALWAYS maintain the current website's structure and only modify what the user asks to change
4. For content changes (text, headings, paragraphs), preserve the HTML structure and only update the text content
5. ALWAYS use Tailwind CSS classes for ALL styling - DO NOT use custom CSS
6. ALWAYS include proper viewport meta tags and content structure
7. ONLY respond in this exact JSON format:
{
  "html": "<The complete HTML code for the website>",
  "css": "",
  "message": "A brief description of what was created or modified",
  "isNewWebsite": true
}

STYLING GUIDELINES:

Tailwind:
- Use Tailwind's utility classes for ALL styling
- Follow mobile-first responsive design (sm:, md:, lg:)
- Use proper spacing utilities (p-4, m-2, etc.)
- Use flex and grid utilities for layout
- Use proper text utilities for typography
- Common patterns:
  - Container: container mx-auto px-4
  - Flex layout: flex items-center justify-between
  - Grid layout: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
  - Text styles: text-sm text-neutral-600 hover:text-neutral-900
  - Spacing: space-y-4 gap-8 p-4 my-8

Layout:
- Use semantic HTML (nav, main, section, article, etc.)
- Maintain proper heading hierarchy (h1, h2, etc.)
- Create responsive designs that work on all devices
- Use proper padding and margin for spacing
- Structure sections with container and max-width

Components:
- Navigation: Fixed header with backdrop blur
- Buttons: Proper padding, hover states
- Cards: Consistent spacing, subtle shadows
- Lists: Proper gap spacing
- Images: Proper aspect ratios, object-fit

Example HTML Structure:
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Title</title>
  </head>
  <body class="bg-white">
    <nav class="fixed w-full bg-white/80 backdrop-blur-md border-b z-50">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="#" class="text-xl font-semibold">Brand</a>
        <div class="flex items-center gap-6">
          <a href="#" class="text-sm text-neutral-600 hover:text-neutral-900">Link</a>
        </div>
      </div>
    </nav>
    <main class="pt-20">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold">Heading</h1>
        <p class="mt-4 text-lg text-neutral-600">Content</p>
      </div>
    </main>
  </body>
</html>`

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,
      currentHtml: null,
      currentCss: null,
      sendMessage: async (content: string) => {
        set({ isLoading: true, error: null })

        try {
          const newMessage: Message = {
            role: 'user',
            content,
            timestamp: new Date(),
          }

          set((state) => ({
            messages: [...state.messages, newMessage],
          }))

          const { currentHtml, currentCss } = get()

          // Add current website state to the context if it exists
          const contextMessage =
            currentHtml && currentCss
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

          console.log('Sending request to OpenAI...')
          const response = await openai.chat.completions.create({
            model: 'gpt-4',
            temperature: 0.7,
            stream: true,
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
          })

          let streamedResponse = ''
          let tempMessage: Message = {
            role: 'assistant',
            content: currentHtml
              ? 'Modifying your website...'
              : 'Generating your website...',
            timestamp: new Date(),
          }

          // Add a temporary message that we'll update as we stream
          set((state) => ({
            messages: [...state.messages, tempMessage],
          }))

          let jsonStartIndex = -1
          let completeJson = ''

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            streamedResponse += content

            // Find the start of the JSON object
            if (jsonStartIndex === -1) {
              jsonStartIndex = streamedResponse.indexOf('{')
            }

            if (jsonStartIndex !== -1) {
              // Extract everything from the JSON start
              completeJson = streamedResponse.slice(jsonStartIndex)

              if (completeJson.trim().endsWith('}')) {
                try {
                  const parsedResponse = JSON.parse(completeJson)
                  if (parsedResponse.html && parsedResponse.message) {
                    console.log('Valid response received')

                    // Update the preview and store the current state
                    const updatePreview = usePreviewStore.getState().updatePreview
                    updatePreview(parsedResponse.html, parsedResponse.css)
                    set({
                      currentHtml: parsedResponse.html,
                      currentCss: parsedResponse.css,
                    })

                    // Update the final message
                    tempMessage.content = parsedResponse.message
                    set((state) => {
                      const messages = [...state.messages]
                      messages[messages.length - 1] = { ...tempMessage }
                      return { messages, isLoading: false }
                    })
                    return
                  }
                } catch (error) {
                  // Only throw if we've waited for a complete response
                  if (!streamedResponse.includes('"message":')) {
                    console.debug('Partial response, continuing to stream...')
                  } else {
                    throw new Error('Invalid JSON format in response')
                  }
                }
              }
            }
          }

          throw new Error('No valid JSON response received from OpenAI')
        } catch (error) {
          console.error('Chat error:', error)
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to generate website'
          set({
            error: `Error: ${errorMessage}. Please try again.`,
            isLoading: false,
          })
        }
      },
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'chat-store',
    }
  )
)
