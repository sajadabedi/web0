'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/tailwind-utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
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
          className={cn('gap-2 justify-between', className)}
        >
          <div className="flex items-center gap-2">
            {triggerIcon}
            {triggerPreview || selectedOption?.preview}
            {(triggerLabel || selectedOption?.label) && (
              <span className="text-sm text-black dark:text-white">
                {triggerLabel || selectedOption?.label}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-black dark:text-white" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] rounded-md shadow-lg p-1 z-50"
          sideOffset={5}
          align={align}
        >
          {options.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              className={cn(
                'relative flex items-center px-2 py-2 text-sm outline-none cursor-default',
                'text-black dark:text-white hover:bg-accent hover:text-accent-foreground rounded-sm',
                value === option.value && 'bg-accent text-accent-foreground'
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
