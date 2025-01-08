'use client'

import { Button } from '@/components/ui/button'
import { useChatStore } from '@/lib/hooks/use-chat'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Tabs from '@radix-ui/react-tabs'
import { History, Maximize2, MessageSquare, Minimize2 } from 'lucide-react'
import { useState } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

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
    if (!inputValue.trim() || isLoading) return

    await sendMessage(inputValue)
    setInputValue('')
  }

  const handleExampleClick = (prompt: string) => {
    if (!isLoading) {
      sendMessage(prompt)
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
          <Minimize2 size={18} className="group-hover:scale-110 transition-transform" />
        ) : (
          <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
        )}
      </Button>

      {isExpanded && (
        <Tabs.Root defaultValue="chat" className="h-full flex flex-col">
          <div className="sticky top-0 bg-background z-10">
            <Tabs.List className="grid w-full grid-cols-2 mt-12 px-4 border-b">
              <Tabs.Trigger
                value="chat"
                className="flex gap-2 items-center justify-center py-2 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary -mb-[2px]"
              >
                <MessageSquare size={18} />
                Builder
              </Tabs.Trigger>
              <Tabs.Trigger
                value="history"
                className="flex gap-2 items-center justify-center py-2 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary -mb-[2px]"
              >
                <History size={18} />
                History
              </Tabs.Trigger>
            </Tabs.List>
          </div>

          <Tabs.Content
            value="chat"
            className="flex-1 flex flex-col h-[calc(100vh-116px)]"
          >
            {messages.length === 0 ? (
              <div className="flex-1 p-4 space-y-4">
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
              <ScrollArea.Root className="flex-1 overflow-hidden">
                <ScrollArea.Viewport className="h-full w-full p-4">
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'
                        }`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {msg.role === 'user' ? 'Your Request' : 'Generated Website'}
                        </div>
                        {msg.content}
                      </div>
                    ))}
                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical">
                  <ScrollArea.Thumb />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            )}

            <div className="sticky bottom-0 bg-background border-t p-4">
              <form onSubmit={handleSubmit}>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe the website you want to build..."
                    className="w-full p-2 rounded-md border bg-background"
                    disabled={isLoading}
                  />
                </div>
              </form>
            </div>
          </Tabs.Content>

          <Tabs.Content value="history" className="flex-1 h-[calc(100vh-116px)]">
            <ScrollArea.Root className="h-full">
              <ScrollArea.Viewport className="h-full w-full p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Your website building history will appear here
                    </p>
                  ) : (
                    messages.map(
                      (msg, i) =>
                        msg.role === 'user' && (
                          <button
                            key={i}
                            onClick={() => handleExampleClick(msg.content)}
                            className="w-full text-left p-2 text-sm rounded-md hover:bg-primary/10"
                            disabled={isLoading}
                          >
                            {msg.content}
                          </button>
                        )
                    )
                  )}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical">
                <ScrollArea.Thumb />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </Tabs.Content>
        </Tabs.Root>
      )}
    </div>
  )
}
