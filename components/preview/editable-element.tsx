'use client'

import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'
import { usePreviewStore } from '@/lib/stores/use-preview-store'
import { cn } from '@/lib/utils/tailwind-utils'
import { type JSX } from 'react'
import { useCallback, useState } from 'react'

interface EditableElementProps {
  elementId: string
  initialContent: string
  tag?: keyof JSX.IntrinsicElements
  className?: string
}

export function EditableElement({
  elementId,
  initialContent,
  tag = 'div',
  className,
}: EditableElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent)
  const { updateElement } = usePreviewStore()

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleBlur = useCallback(() => {
    handleSave()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }, [])

  const handleSave = useCallback(() => {
    updateElement(elementId, content, { fontSize: '', color: '' })
    setIsEditing(false)
  }, [elementId, content, updateElement])

  // Register keyboard shortcuts when editing
  useKeyboardShortcut('Enter', handleSave, false)
  useKeyboardShortcut('Escape', handleBlur, false)

  const Component = tag as keyof JSX.IntrinsicElements

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={cn('relative', className)}
    >
      {isEditing ? (
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      ) : (
        <Component
          className={cn(
            'cursor-pointer outline-1 outline-transparent hover:outline-red-500',
            className
          )}
        >
          {content}
        </Component>
      )}
    </div>
  )
}
