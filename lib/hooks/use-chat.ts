'use client'

import OpenAI from 'openai'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { usePreviewStore } from '../stores/use-preview-store'
import { getMultipleUnsplashImages } from '../utils/unsplash'

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
7. ALWAYS include images in appropriate sections (hero, cards, galleries) unless specifically asked not to
8. For images, use this EXACT format:
   <unsplash-image query="SEARCH_TERMS" alt="DESCRIPTIVE_ALT_TEXT" />
   Replace SEARCH_TERMS with relevant keywords (e.g., "modern office business")
   Replace DESCRIPTIVE_ALT_TEXT with proper alt text for accessibility
9. ONLY respond in this exact JSON format:
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
- Images:
  - Always use aspect-ratio containers
  - Always include loading="lazy" for below-the-fold images
  - Always use descriptive alt text
  - Always use object-cover for images
  - Use relevant search terms for the context

Example image usage for a business website:
<div class="aspect-video rounded-lg overflow-hidden">
  <unsplash-image query="modern office business professional" alt="Modern office space with professionals collaborating" />
</div>

Example card with image for a restaurant website:
<div class="rounded-lg overflow-hidden shadow-lg">
  <div class="aspect-[4/3]">
    <unsplash-image query="gourmet restaurant food cuisine" alt="Delicious gourmet dish presentation" />
  </div>
  <div class="p-4">
    <h3 class="text-lg font-semibold">Our Specialties</h3>
    <p class="text-neutral-600">Experience our unique culinary creations</p>
  </div>
</div>

Image Search Terms by Website Type:
- Business/Corporate: modern office business professional corporate
- Restaurant: restaurant food cuisine dining gourmet
- Portfolio: creative design art studio workspace
- Real Estate: modern home architecture interior luxury
- E-commerce: product lifestyle shopping retail
- Travel: travel landscape destination scenic
- Technology: technology modern innovation tech
- Health/Fitness: fitness health workout gym wellness
- Education: education learning students campus library
- Personal Blog: lifestyle personal blogging coffee workspace`

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
            model: process.env.NEXT_PUBLIC_GPT || 'gpt-4',
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

                  // Extract all image queries
                  const imageRegex = /<unsplash-image query="([^"]+)" alt="([^"]+)" \/>/g
                  const matches = [...parsedResponse.html.matchAll(imageRegex)]
                  
                  if (matches.length > 0) {
                    const queries = matches.map(match => match[1])
                    const alts = matches.map(match => match[2])
                    
                    // Fetch all images
                    const images = await getMultipleUnsplashImages(queries)
                    
                    // Replace image placeholders with actual images
                    let processedHtml = parsedResponse.html
                    images.forEach((image, index) => {
                      const placeholder = `<unsplash-image query="${queries[index]}" alt="${alts[index]}" />`
                      const imgHtml = `
                        <img 
                          src="${image.url}" 
                          alt="${alts[index]}"
                          class="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div class="text-xs text-gray-500 mt-1">
                          Photo by <a href="${image.credit.link}" target="_blank" rel="noopener noreferrer" class="underline">${image.credit.name}</a> on Unsplash
                        </div>
                      `
                      processedHtml = processedHtml.replace(placeholder, imgHtml)
                    })

                    parsedResponse.html = processedHtml
                  }

                  // Update the preview store
                  const updatePreview = usePreviewStore.getState().updatePreview
                  updatePreview(parsedResponse.html, parsedResponse.css)

                  set((state) => ({
                    messages: state.messages.map((msg, i) =>
                      i === state.messages.length - 1
                        ? { ...msg, content: parsedResponse.message }
                        : msg
                    ),
                    currentHtml: parsedResponse.html,
                    currentCss: parsedResponse.css,
                    isLoading: false,
                  }))
                  break
                } catch (e) {
                  // Ignore parsing errors for incomplete JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Error:', error)
          set({ error: 'Failed to generate website', isLoading: false })
        }
      },
      setError: (error) => set({ error }),
    }),
    {
      name: 'chat-store',
    }
  )
)
