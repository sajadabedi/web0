'use client'

import { Button } from '@/components/ui/button'
import { LoadingDots } from '@/components/ui/loading-dots'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip } from '@/components/ui/tooltip'
import { useChatStore } from '@/lib/hooks/use-chat'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'
import { usePreviewStore } from '@/lib/stores/use-preview-store'
import { useWebsiteVersionStore } from '@/lib/stores/use-website-version-store'
import { EXAMPLE_PROMPTS } from '@/lib/system-prompt'
import { ArrowUp, History, PanelRightClose, PanelRightOpen, Square } from 'lucide-react'
import { useState } from 'react'

interface ChatInterfaceProps {
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export function ChatInterface({ isExpanded, onExpandedChange }: ChatInterfaceProps) {
  const { messages, sendMessage, isLoading, removeMessagesAfter, stopGeneration } =
    useChatStore()
  const { versions, getLatestNonManualVersion } = useWebsiteVersionStore()
  const { revertToVersion } = usePreviewStore()
  const [inputValue, setInputValue] = useState('')

  useKeyboardShortcut('\\', () => onExpandedChange(!isExpanded))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    // Get the latest non-manual version before applying new changes
    const { version: baseVersion } = getLatestNonManualVersion()
    if (baseVersion) {
      // Remove all messages after this version to maintain consistency
      removeMessagesAfter(baseVersion.messageId)
    }

    setInputValue('')
    await sendMessage(inputValue)
  }

  const handleStop = () => {
    stopGeneration()
  }

  const handleExampleClick = async ({
    label,
    prompt,
  }: {
    label: string
    prompt: string
  }) => {
    if (isLoading) return

    // Get the latest non-manual version before applying new changes
    const { version: baseVersion } = getLatestNonManualVersion()
    if (baseVersion) {
      // Remove all messages after this version to maintain consistency
      removeMessagesAfter(baseVersion.messageId)
    }

    setInputValue('')
    try {
      await sendMessage(prompt)
    } catch (error) {
      console.error('Failed to send example message:', error)
    }
  }

  const handleRevertToVersion = async (messageId: string) => {
    const version = versions.find((v) => v.messageId === messageId)
    if (!version) return

    removeMessagesAfter(messageId)
    revertToVersion(version.id)
  }

  return (
    <div
      className={`relative border-r dark:border-neutral-800 transition-[width] duration-300 ease-in-out ${
        isExpanded ? 'w-[400px]' : 'w-[50px]'
      }`}
    >
      <Tooltip side="right" content={`${isExpanded ? 'Collapse' : 'Expand'} (⌘+\\)`}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-2 group text-black dark:text-white"
          onClick={() => onExpandedChange(!isExpanded)}
        >
          {isExpanded ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
        </Button>
      </Tooltip>

      {isExpanded && (
        <div className="h-full flex flex-col pt-12 text-black dark:text-white dark:bg-neutral-900">
          <ScrollArea className="flex-1">
            <div className="pb-4">
              {messages.length === 0 ? (
                <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-4 space-y-4">
                  <p className="text-sm text-center text-gray-600 dark:text-neutral-400 w-[80%]">
                    Starter templates to get you started.
                  </p>
                  <div className="w-full max-w-sm justify-center flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map(({ label, prompt }) => (
                      <button
                        key={label}
                        onClick={() => handleExampleClick({ label, prompt })}
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
                        className={`group relative p-3 rounded-xl text-gray-800 dark:text-white text-[14px] font-[450] ${
                          msg.role === 'user'
                            ? 'bg-gray-100 dark:bg-neutral-800 max-w-[80%]'
                            : 'bg-transparent'
                        }`}
                      >
                        {msg.content === 'Creating your website...' ||
                        msg.content === 'Modifying your website...' ? (
                          <LoadingDots />
                        ) : (
                          msg.content
                        )}
                        {msg.role === 'user' &&
                          versions.some((v) => v.messageId === msg.id) && (
                            <button
                              onClick={() => handleRevertToVersion(msg.id!)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Revert to this version"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
            <form onSubmit={handleSubmit} className="p-3">
              <div className="relative flex items-center">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Describe your ask..."
                  className="w-full px-3 font-[450] py-2 text-sm rounded-md bg-transparent caret-pink-500 text-black dark:text-white focus:outline-none"
                  disabled={isLoading}
                />
                <Tooltip content={isLoading ? 'Stop generating' : 'Send message'}>
                  <Button
                    size="icon"
                    variant="ghost"
                    type={isLoading ? 'button' : 'submit'}
                    onClick={isLoading ? handleStop : undefined}
                    className="absolute right-0 group text-black dark:text-white hover:bg-transparent"
                    disabled={!inputValue.trim() && !isLoading}
                  >
                    {isLoading ? (
                      <Square className="h-4 w-4 fill-red-500" />
                    ) : (
                      <div className="h-5 w-5 group-disabled:opacity-0 flex items-center justify-center rounded-full bg-[var(--accent-color)]">
                        <ArrowUp className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </Button>
                </Tooltip>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
