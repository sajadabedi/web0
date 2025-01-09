import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
