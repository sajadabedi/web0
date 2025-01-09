'use client'

import { useChatStore } from '@/lib/hooks/use-chat'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'
import { EXAMPLE_PROMPTS } from '@/lib/system-prompt'
import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { useState } from 'react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { sendMessage, currentHtml } = useChatStore()

  useKeyboardShortcut('k', () => setOpen((open) => !open))

  const handleSubmit = async (input: string) => {
    if (!input.trim()) return
    setOpen(false)
    await sendMessage(input)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 p-0 shadow-lg">
          <Dialog.Title className="sr-only">Command Menu</Dialog.Title>
          <Command className="relative" shouldFilter={false}>
            <Command.Input
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const input = (e.target as HTMLInputElement).value
                  handleSubmit(input)
                }
              }}
              placeholder={
                currentHtml ? 'Describe your changes...' : 'Describe your ask...'
              }
              className="flex h-14 w-full caret-pink-500 text-black dark:text-white rounded-lg border-0 bg-transparent px-4 outline-none placeholder:text-neutral-500 focus:ring-0 dark:placeholder:text-neutral-400"
            />
            <Command.List className="max-h-[300px] overflow-y-auto p-4 border-t-[0.5px] border-neutral-200 dark:border-neutral-700/70 bg-gray-50 dark:bg-neutral-900">
              {!currentHtml && (
                <>
                  <div className="mb-2 text-[11px] tracking-widest uppercase font-medium text-neutral-500 dark:text-neutral-400">
                    Starter templates
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {EXAMPLE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.label}
                        onClick={() => handleSubmit(prompt.prompt)}
                        className="px-3 py-1 text-gray-600 dark:text-neutral-400 text-sm border border-gray-200 dark:border-neutral-700/50 rounded-full hover:border-neutral-100 dark:hover:border-neutral-600 transition-colors"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
