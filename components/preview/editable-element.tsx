'use client'

import { usePreviewStore } from '@/lib/stores/use-preview-store'
import { cn } from '@/lib/utils/tailwind-utils'
import type { JSX as JSXNS } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'

interface EditableElementProps {
  elementId: string
  initialContent: string
  tag?: keyof JSXNS.IntrinsicElements
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
  const editRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    updateElement(elementId, content)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setContent(initialContent)
    setIsEditing(false)
  }

  // Register keyboard shortcuts when editing
  useKeyboardShortcut('Enter', handleSave, false)
  useKeyboardShortcut('Escape', handleCancel, false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const Tag = tag as any

  if (isEditing) {
    return (
      <div className="relative group">
        <div
          ref={editRef}
          contentEditable
          className={cn(
            'min-h-[1em] outline-none border-2 border-red-500 rounded px-2 py-1',
            className
          )}
          onInput={(e) => setContent(e.currentTarget.textContent || '')}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <Tag
      className={cn(
        'cursor-pointer outline-1 outline-transparent hover:outline-red-500',
        className
      )}
      onDoubleClick={handleDoubleClick}
    >
      {content}
    </Tag>
  )
}
