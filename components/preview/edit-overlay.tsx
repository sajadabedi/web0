'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/tailwind-utils'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'

interface EditOverlayProps {
  elementId: string
  initialContent: string
  position: { x: number; y: number }
  onSave: (content: string) => void
  onCancel: () => void
}

export function EditOverlay({
  elementId,
  initialContent,
  position,
  onSave,
  onCancel,
}: EditOverlayProps) {
  const [content, setContent] = useState(initialContent)
  const editRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editRef.current) {
      editRef.current.focus()
      editRef.current.textContent = initialContent

      // Place cursor at the end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(editRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [initialContent])

  // Register keyboard shortcuts
  useKeyboardShortcut('Enter', () => onSave(content), false)
  useKeyboardShortcut('Escape', onCancel, false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave(content)
    }
  }

  return (
    <div
      className="fixed z-50 bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-2"
      style={{
        top: position.y,
        left: position.x,
        minWidth: '240px',
        maxWidth: '400px',
      }}
    >
      <div className="flex flex-col gap-4 relative">
        <div className="relative">
          <div
            ref={editRef}
            contentEditable
            className={cn(
              'min-h-[1em] outline-none rounded px-2 py-1 text-black dark:text-white'
            )}
            onInput={(e) => setContent(e.currentTarget.textContent || '')}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
          >
            {initialContent}
          </div>
        </div>
      </div>
    </div>
  )
}
