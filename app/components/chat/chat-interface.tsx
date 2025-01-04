"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import * as Tabs from "@radix-ui/react-tabs"
import { MessageSquare, History, Maximize2, Minimize2, Command } from "lucide-react"
import { useKeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcut"
import { useChat } from "@/lib/hooks/use-chat"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const EXAMPLE_PROMPTS = [
  "Build a modern portfolio website",
  "Create a landing page for a fitness app",
  "Make a simple blog layout",
  "Design a restaurant website",
  "Build a photography portfolio"
]

export function ChatInterface() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { messages, sendMessage, isLoading } = useChat()
  const [inputValue, setInputValue] = useState("")

  // Toggle chat with Command+K
  useKeyboardShortcut("k", () => setIsExpanded(prev => !prev))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    await sendMessage(inputValue)
    setInputValue("")
  }

  const handleExampleClick = (prompt: string) => {
    if (!isLoading) {
      sendMessage(prompt)
    }
  }

  return (
    <div 
      className={`h-full bg-background border-r transition-[width] duration-300 ease-in-out ${
        isExpanded ? "w-[400px]" : "w-12"
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-2 group"
        onClick={() => setIsExpanded(!isExpanded)}
        title={`${isExpanded ? "Collapse" : "Expand"} (⌘K)`}
      >
        {isExpanded ? (
          <Minimize2 size={18} className="group-hover:scale-110 transition-transform" />
        ) : (
          <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
        )}
      </Button>

      {isExpanded && (
        <Tabs.Root defaultValue="chat" className="h-full flex flex-col">
          <Tabs.List className="grid w-full grid-cols-2 mt-12 px-4">
            <Tabs.Trigger
              value="chat"
              className="flex gap-2 items-center justify-center py-2 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <MessageSquare size={18} />
              Builder
            </Tabs.Trigger>
            <Tabs.Trigger
              value="history"
              className="flex gap-2 items-center justify-center py-2 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <History size={18} />
              History
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="chat" className="flex-1 flex flex-col">
            {messages.length === 0 && (
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Start by describing the website you want to build, or try one of these examples:
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
            )}
            
            <ScrollArea.Root className="flex-1">
              <ScrollArea.Viewport className="h-full w-full p-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`mb-4 p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary/10 ml-4"
                        : "bg-muted mr-4"
                    }`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {msg.role === "user" ? "Your Request" : "Generated Website"}
                    </div>
                    {msg.content}
                  </div>
                ))}
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical">
                <ScrollArea.Thumb />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>

            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe the website you want to build..."
                    className="w-full p-2 pr-8 rounded-md border bg-background"
                    disabled={isLoading}
                  />
                  <Command className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Build"}
                </Button>
              </div>
            </form>
          </Tabs.Content>

          <Tabs.Content value="history" className="flex-1">
            <ScrollArea.Root className="h-full p-4">
              <ScrollArea.Viewport className="h-full w-full">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Your website building history will appear here
                    </p>
                  ) : (
                    messages.map((msg, i) => (
                      msg.role === "user" && (
                        <button
                          key={i}
                          onClick={() => handleExampleClick(msg.content)}
                          className="w-full text-left p-2 text-sm rounded-md hover:bg-primary/10"
                          disabled={isLoading}
                        >
                          {msg.content}
                        </button>
                      )
                    ))
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
