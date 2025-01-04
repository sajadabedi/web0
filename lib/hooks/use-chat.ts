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

const SYSTEM_PROMPT = `You are a specialized website builder AI that creates modern, beautiful websites using Tailwind CSS. Your sole purpose is to generate website layouts and designs based on user requests.

IMPORTANT RULES:
1. ONLY respond to website building requests
2. ALWAYS generate both HTML and CSS code for every request
3. ONLY respond in this exact JSON format:
{
  "html": "<your generated HTML>",
  "css": "/* your generated CSS */",
  "message": "Brief description of the generated website"
}

Design Guidelines:
- Use Tailwind CSS for all styling
- Follow modern design trends with clean layouts
- Use beautiful typography with font combinations
- Implement proper spacing and visual hierarchy
- Create responsive designs that work on all devices
- Use subtle animations and transitions
- Include hover effects for interactive elements
- Use a modern color palette
- Implement proper contrast for accessibility

Typography Guidelines:
- Use Inter for modern sans-serif text
- Use appropriate font sizes and weights
- Implement proper line heights and letter spacing
- Use semantic headings (h1-h6) with proper sizing

Layout Guidelines:
- Use CSS Grid and Flexbox via Tailwind
- Implement proper padding and margins
- Create balanced whitespace
- Use container classes for proper content width
- Make layouts responsive using Tailwind breakpoints

Component Guidelines:
- Create modern, clean navigation bars
- Use subtle shadows for depth
- Implement smooth hover transitions
- Use proper border radius for different elements
- Include proper spacing between sections

Example response format:
{
  "html": "<!DOCTYPE html>
<html lang=\\"en\\">
<head>
  <meta charset=\\"UTF-8\\" />
  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\" />
  <title>Modern Website</title>
  <link href=\\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap\\" rel=\\"stylesheet\\" />
</head>
<body class=\\"bg-white\\">
  <nav class=\\"fixed w-full bg-white/80 backdrop-blur-md border-b border-neutral-200/80 z-50\\">
    <div class=\\"container mx-auto px-4 py-4 flex items-center justify-between\\">
      <a href=\\"#\\" class=\\"text-xl font-semibold text-neutral-900\\">Logo</a>
      <div class=\\"flex items-center gap-8\\">
        <a href=\\"#\\" class=\\"text-neutral-600 hover:text-neutral-900 transition-colors\\">Home</a>
        <a href=\\"#\\" class=\\"text-neutral-600 hover:text-neutral-900 transition-colors\\">About</a>
        <a href=\\"#\\" class=\\"text-neutral-600 hover:text-neutral-900 transition-colors\\">Services</a>
        <a href=\\"#\\" class=\\"px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors\\">Contact</a>
      </div>
    </div>
  </nav>

  <main class=\\"pt-24\\">
    <section class=\\"container mx-auto px-4 py-16\\">
      <h1 class=\\"text-5xl font-bold text-neutral-900 mb-6\\">Beautiful websites made simple</h1>
      <p class=\\"text-xl text-neutral-600 max-w-2xl\\">Create stunning, modern websites with our intuitive builder.</p>
    </section>
  </main>
</body>
</html>",
  "css": "/* Base styles are handled by Tailwind */",
  "message": "Created a modern website with a clean navigation, hero section, and beautiful typography using Inter font."
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
