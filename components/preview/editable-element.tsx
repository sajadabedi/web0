'use client'

import { Button } from '@/components/ui/button'
import { usePreviewStore } from '@/lib/stores/use-preview-store'
import { cn } from '@/lib/utils/tailwind-utils'
import { Check, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { JSX as JSXNS } from 'react'

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

  const Tag = tag as any

  if (isEditing) {
    return (
      <div className="relative group">
        <div
          ref={editRef}
          contentEditable
          className={cn(
            'min-h-[1em] outline-none border-2 border-blue-500 rounded px-2 py-1',
            className
          )}
          onBlur={(e) => setContent(e.currentTarget.textContent || '')}
          suppressContentEditableWarning
        >
          {content}
        </div>
        <div className="absolute -top-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="secondary" className="h-6 px-2" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 px-2"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Tag
      className={cn(
        'cursor-pointer hover:outline-dashed hover:outline-blue-500',
        className
      )}
      onDoubleClick={handleDoubleClick}
    >
      {content}
    </Tag>
  )
}
