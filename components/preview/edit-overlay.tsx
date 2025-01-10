'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/tailwind-utils'
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, Type } from 'lucide-react'

interface EditOverlayProps {
  elementId: string
  initialContent: string
  initialStyles?: {
    fontSize: string
    color: string
  }
  position: { x: number; y: number }
  onSave: (content: string, styles: { color: string; fontSize: string }) => void
  onCancel: () => void
}

interface EditableStyles {
  color: string
  fontSize: string
}

const fontSizes = [
  { label: 'Small', value: 'text-sm' },
  { label: 'Normal', value: 'text-base' },
  { label: 'Large', value: 'text-lg' },
  { label: 'XL', value: 'text-xl' },
  { label: '2XL', value: 'text-2xl' },
  { label: '3XL', value: 'text-3xl' },
] as const

const colors = [
  { label: 'Default', value: '' },
  { label: 'Black', value: 'text-black' },
  { label: 'White', value: 'text-white' },
  { label: 'Gray', value: 'text-gray-500' },
  { label: 'Red', value: 'text-red-500' },
  { label: 'Orange', value: 'text-orange-500' },
  { label: 'Yellow', value: 'text-yellow-500' },
  { label: 'Green', value: 'text-green-500' },
  { label: 'Blue', value: 'text-blue-500' },
  { label: 'Purple', value: 'text-purple-500' },
  { label: 'Pink', value: 'text-pink-500' },
] as const

export function EditOverlay({
  elementId,
  initialContent,
  initialStyles,
  position,
  onSave,
  onCancel,
}: EditOverlayProps) {
  const editRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(initialContent)
  const [styles, setStyles] = useState<EditableStyles>({
    color: initialStyles?.color || '',
    fontSize: initialStyles?.fontSize || 'text-base',
  })
  const [colorOpen, setColorOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)

  // Initialize content when component mounts
  useEffect(() => {
    if (editRef.current) {
      const div = editRef.current as HTMLDivElement
      div.innerText = initialContent
      div.focus()
    }
  }, [initialContent])

  // Get current font size label
  const getCurrentFontSize = () => {
    const size = fontSizes.find(s => s.value === styles.fontSize)
    console.log('Current font size:', { size, fontSize: styles.fontSize }) // Debug log
    return size ? size.label : 'Normal'
  }

  // Register keyboard shortcuts
  useKeyboardShortcut('Enter', () => handleSave(), false)
  useKeyboardShortcut('Escape', onCancel, false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    const isWithinOverlay = overlayRef.current?.contains(relatedTarget)
    const isDropdownMenu = relatedTarget?.closest('[role="menu"]')
    const isDropdownTrigger = relatedTarget?.closest('[role="button"]')
    
    if (!isWithinOverlay && !isDropdownMenu && !isDropdownTrigger) {
      onCancel()
    }
  }

  const handleSave = () => {
    const currentContent = editRef.current?.innerText || content
    onSave(currentContent, styles)
  }

  return (
    <div
      ref={overlayRef}
      className="edit-overlay-container fixed z-50 bg-white dark:bg-neutral-800 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(255,255,255,0.1)] caret-pink-500 rounded-lg p-4"
      style={{
        top: position.y,
        left: position.x,
        minWidth: '320px',
        maxWidth: '480px',
      }}
    >
      <div className="flex flex-col gap-4 relative">
        {/* Text Editor */}
        <div className="relative">
          <div
            ref={editRef}
            contentEditable
            className="min-h-[1em] outline-none rounded px-3 py-2 text-black dark:text-white border border-input"
            onInput={(e) => setContent(e.currentTarget.innerText)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            suppressContentEditableWarning
          />
        </div>

        {/* Style Controls */}
        <div className="flex gap-2 items-center">
          {/* Font Color */}
          <DropdownMenu.Root open={colorOpen} onOpenChange={setColorOpen}>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <div className={cn('w-4 h-4 rounded-full bg-current', styles.color || 'bg-black dark:bg-white')} />
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[220px] bg-white rounded-md shadow-lg p-1 z-50 dark:bg-neutral-800"
                sideOffset={5}
                align="start"
              >
                {colors.map((color) => (
                  <DropdownMenu.Item
                    key={color.value}
                    className={cn(
                      'relative flex items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none cursor-default',
                      'hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-sm'
                    )}
                    onSelect={(e) => {
                      e.preventDefault()
                      setStyles({ ...styles, color: color.value })
                      setColorOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('w-4 h-4 rounded-full bg-current', color.value || 'bg-black dark:bg-white')} />
                      <span className={cn('flex-1', color.value)}>{color.label}</span>
                    </div>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Font Size */}
          <DropdownMenu.Root open={sizeOpen} onOpenChange={setSizeOpen}>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline" size="sm" className="gap-2 min-w-[100px] justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{getCurrentFontSize()}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[180px] bg-white rounded-md shadow-lg p-1 z-50 dark:bg-neutral-800"
                sideOffset={5}
                align="start"
              >
                {fontSizes.map((size) => (
                  <DropdownMenu.Item
                    key={size.value}
                    className={cn(
                      'relative flex items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none cursor-default',
                      'hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-sm',
                      styles.fontSize === size.value && 'bg-gray-100 dark:bg-neutral-700'
                    )}
                    onSelect={(e) => {
                      e.preventDefault()
                      setStyles({ ...styles, fontSize: size.value })
                      setSizeOpen(false)
                    }}
                  >
                    {size.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div className="flex-1" />

          {/* Save Button */}
          <Button onClick={handleSave} size="sm" className="bg-pink-500 hover:bg-pink-600">
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
