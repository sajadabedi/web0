'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/tailwind-utils'

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
    }
  }, [])

  const handleSave = () => {
    onSave(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      className="fixed z-50 bg-white dark:bg-neutral-900 shadow-lg rounded-lg border border-neutral-200 dark:border-neutral-800 p-4"
      style={{
        top: position.y,
        left: position.x,
        minWidth: '200px',
        maxWidth: '400px',
      }}
    >
      <div className="flex flex-col gap-4">
        <div
          ref={editRef}
          contentEditable
          className={cn(
            'min-h-[1em] outline-none border-2 border-blue-500 rounded px-2 py-1',
            'focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
          )}
          onBlur={(e) => setContent(e.currentTarget.textContent || '')}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        >
          {content}
        </div>
        <div className="flex justify-end gap-2 text-xs text-neutral-500">
          <span>Press Enter to save, Shift+Enter for new line, Esc to cancel</span>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8"
            onClick={handleSave}
          >
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
