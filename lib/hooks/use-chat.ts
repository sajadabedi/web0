'use client'

import { create } from 'zustand'
import OpenAI from 'openai'
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
  sendMessage: (content: string) => Promise<void>
  setError: (error: string | null) => void
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

const SYSTEM_PROMPT = `You are a specialized website builder AI. Your sole purpose is to generate website layouts and designs based on user requests.

IMPORTANT RULES:
1. ONLY respond to website building requests
2. ALWAYS generate both HTML and CSS code for every request
3. ONLY respond in this exact JSON format:
{
  "html": "<your generated HTML>",
  "css": "/* your generated CSS */",
  "message": "Brief description of the generated website"
}

Website Building Guidelines:
- Use semantic HTML5 elements (header, nav, main, section, footer)
- Create responsive layouts using modern CSS (flexbox/grid)
- Include common website sections (header, main, footer)
- Add realistic placeholder content that makes sense for the type of website
- Use a modern, clean design approach
- Include hover states and smooth transitions
- Ensure mobile responsiveness
- Use web-safe fonts and relative units

Example response format:
{
  "html": "<header class='site-header'><nav>...</nav></header><main>...</main><footer>...</footer>",
  "css": "/* Base styles */\n.site-header { ... }\n.nav { ... }\n/* Add your styles here */",
  "message": "Created a modern responsive website with navigation, hero section, and footer"
}

If the user asks anything unrelated to website building, respond with:
{
  "html": "",
  "css": "",
  "message": "I can only help with website creation. Please describe the website you'd like to build."
}`

export const useChat = create<ChatStore>((set, get) => {
  const updatePreview = usePreviewStore.getState().updatePreview

  return {
    messages: [],
    isLoading: false,
    error: null,
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

        console.log('Sending request to OpenAI...')
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            ...get().messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content },
          ],
        })

        const responseContent = response.choices[0]?.message?.content
        console.log('OpenAI response:', responseContent)

        if (!responseContent) {
          console.error('No response content from OpenAI')
          throw new Error('No response from OpenAI')
        }

        try {
          const parsedResponse = JSON.parse(responseContent)
          console.log('Parsed response:', parsedResponse)

          // Validate response format
          if (!parsedResponse.html || !parsedResponse.css || !parsedResponse.message) {
            console.error('Invalid response format:', parsedResponse)
            throw new Error('Invalid response format')
          }

          // Update the preview with the generated code
          console.log('Updating preview with:', {
            htmlLength: parsedResponse.html.length,
            cssLength: parsedResponse.css.length,
          })
          updatePreview(parsedResponse.html, parsedResponse.css)

          const assistantMessage: Message = {
            role: 'assistant',
            content: parsedResponse.message,
            timestamp: new Date(),
          }

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isLoading: false,
          }))
        } catch (error) {
          console.error('Failed to parse response:', error)
          throw new Error('Invalid response format from OpenAI')
        }
      } catch (error) {
        console.error('Chat error:', error)
        set({
          error: 'Failed to generate website. Please try again.',
          isLoading: false,
        })
      }
    },
    setError: (error: string | null) => set({ error }),
  }
})
