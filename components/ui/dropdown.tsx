'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/tailwind-utils'
import React from 'react'

interface DropdownOption {
  label: string
  value: string
  icon?: React.ReactNode
  preview?: React.ReactNode
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  triggerIcon?: React.ReactNode
  triggerPreview?: React.ReactNode
  triggerLabel?: string
  className?: string
  align?: 'start' | 'center' | 'end'
}

export function Dropdown({
  value,
  options,
  onChange,
  triggerIcon,
  triggerPreview,
  triggerLabel,
  className,
  align = 'start',
}: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 justify-between border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100',
            className
          )}
        >
          <div className="flex items-center gap-2">
            {triggerIcon}
            {triggerPreview || selectedOption?.preview}
            {(triggerLabel || selectedOption?.label) && (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {triggerLabel || selectedOption?.label}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-gray-200 dark:border-neutral-700 p-1 z-50"
          sideOffset={5}
          align={align}
        >
          {options.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              className={cn(
                'relative flex items-center px-2 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none cursor-default rounded-sm',
                'hover:bg-gray-100 dark:hover:bg-neutral-700',
                value === option.value && 'bg-gray-100 dark:bg-neutral-700'
              )}
              onSelect={(e) => {
                e.preventDefault()
                onChange(option.value)
                setOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                {option.preview}
                <span className="flex-1">{option.label}</span>
              </div>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
