'use client'

import { Button } from '@/components/ui/button'
import { useChatStore } from '@/lib/hooks/use-chat'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { usePreviewStore } from '@/lib/stores/use-preview-store'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { History, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useState } from 'react'

const EXAMPLE_PROMPTS = [
  {
    label: 'Modern Portfolio',
    prompt:
      'Build a modern portfolio website with a hero section, about me, skills section, and a projects grid. Each project should have an image, title, description, and tech stack used. Use a minimalist design with smooth animations.',
  },
  {
    label: 'Fitness App',
    prompt:
      'Create a landing page for a fitness app with sections for features, workout plans, testimonials, and pricing. Include high-quality fitness-related images, clear call-to-actions, and a mobile-first responsive design.',
  },
  {
    label: 'Blog',
    prompt:
      'Make a simple blog layout with a featured post section, recent posts grid, categories sidebar, and newsletter signup. Each post should have a cover image, title, excerpt, and reading time estimate.',
  },
  {
    label: 'Restaurant',
    prompt:
      "Design a restaurant website with an elegant hero section showcasing signature dishes, menu categories with food images, about section with the restaurant's story, and a reservation form. Include opening hours and location.",
  },
  {
    label: 'Photography',
    prompt:
      'Build a photography portfolio with a masonry grid gallery, about section, services offered, and contact form. Include image hover effects, lightbox for full-size viewing, and smooth transitions between sections.',
  },
]

export function ChatInterface() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { messages, sendMessage, isLoading, removeMessagesAfter } = useChatStore()
  const { versions } = useWebsiteVersionStore()
  const { revertToVersion } = usePreviewStore()
  const [inputValue, setInputValue] = useState('')

  // Toggle chat with Command+K
  useKeyboardShortcut('k', () => setIsExpanded((prev) => !prev))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedValue = inputValue.trim()
    if (!trimmedValue || isLoading) return

    // Clear input immediately
    setInputValue('')

    try {
      await sendMessage(trimmedValue)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleExampleClick = async (prompt: string) => {
    if (isLoading) return

    // Clear any existing input
    setInputValue('')

    try {
      await sendMessage(prompt)
    } catch (error) {
      console.error('Failed to send example message:', error)
    }
  }

  const handleRevertToVersion = async (messageId: string) => {
    const version = versions.find(v => v.messageId === messageId)
    if (!version) return

    // First revert the preview to update the website state
    revertToVersion(version.id)
    
    // Then remove messages after this one
    removeMessagesAfter(messageId)
  }

  return (
    <div
      className={`h-full border-r dark:border-neutral-800 transition-[width] duration-300 ease-in-out ${
        isExpanded ? 'w-[400px]' : 'w-12'
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-2 group text-black dark:text-white"
        onClick={() => setIsExpanded(!isExpanded)}
        title={`${isExpanded ? 'Collapse' : 'Expand'} (⌘K)`}
      >
        {isExpanded ? (
          <PanelRightOpen
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
        ) : (
          <PanelRightClose
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
        )}
      </Button>

      {isExpanded && (
        <div className="h-full flex flex-col pt-12 text-black dark:text-white">
          <ScrollArea.Root className="flex-1 overflow-hidden">
            <ScrollArea.Viewport className="h-full">
              <div className="pb-4">
                {messages.length === 0 ? (
                  <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-4 space-y-4">
                    <p className="text-sm text-center text-gray-600 dark:text-neutral-400">
                      Describe your website in a few sentences or use example
                    </p>
                    <div className="w-full max-w-sm flex flex-wrap gap-2">
                      {EXAMPLE_PROMPTS.map(({ label, prompt }) => (
                        <button
                          key={label}
                          onClick={() => handleExampleClick(prompt)}
                          className="px-3 py-1 text-gray-600 dark:text-neutral-400 text-sm bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          disabled={isLoading}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 p-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`group relative p-3 rounded-xl text-base ${
                            msg.role === 'user'
                              ? 'bg-gray-100 text-black dark:text-white dark:bg-neutral-800 max-w-[80%]'
                              : 'bg-transparent'
                          }`}
                        >
                          {msg.content}
                          {msg.role === 'user' && versions.some(v => v.messageId === msg.id) && (
                            <button
                              onClick={() => handleRevertToVersion(msg.id!)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Revert to this version"
                            >
                              <History className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              className="flex select-none touch-none p-0.5 bg-muted/10 transition-colors duration-150 ease-out hover:bg-muted/20 data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2"
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-muted-foreground/50 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          <div className="border-t dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
            <form onSubmit={handleSubmit} className="p-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your website..."
                className="w-full px-3 py-2 text-sm rounded-md bg-transparent caret-pink-500 text-black dark:text-white focus:outline-none"
                disabled={isLoading}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
