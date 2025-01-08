'use client'

import { Button } from '@/components/ui/button'
import { useChatStore } from '@/lib/hooks/use-chat'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { PanelRightOpen, PanelRightClose } from 'lucide-react'
import { useState } from 'react'

const EXAMPLE_PROMPTS = [
  'Build a modern portfolio website',
  'Create a landing page for a fitness app',
  'Make a simple blog layout',
  'Design a restaurant website',
  'Build a photography portfolio',
]

export function ChatInterface() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { messages, sendMessage, isLoading } = useChatStore()
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

  return (
    <div
      className={`h-full bg-background border-r transition-[width] duration-300 ease-in-out ${
        isExpanded ? 'w-[400px]' : 'w-12'
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-2 group"
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
        <div className="h-full flex flex-col pt-12">
          <ScrollArea.Root className="flex-1">
            <ScrollArea.Viewport className="h-full">
              {messages.length === 0 ? (
                <div className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Start by describing the website you want to build, or try one of these
                    examples:
                  </p>
                  <div className="space-y-2">
                    {EXAMPLE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleExampleClick(prompt)}
                        className="w-full text-left p-2 text-sm rounded-md hover:bg-primary/10"
                        disabled={isLoading}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'
                      }`}
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {msg.role === 'user' ? 'Your Request' : 'Generated Website'}
                        <span className="ml-2">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              className="flex select-none touch-none p-0.5 bg-muted/10 transition-colors duration-150 ease-out hover:bg-muted/20 data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2"
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-muted-foreground/50 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your website..."
              className="w-full px-3 py-2 text-sm rounded-md bg-muted/50 focus:outline-none"
              disabled={isLoading}
            />
          </form>
        </div>
      )}
    </div>
  )
}
