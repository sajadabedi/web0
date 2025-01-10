'use client'

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { type ReactNode } from 'react'

interface ScrollAreaProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
}

export function ScrollArea({ children, className, viewportClassName }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root className={`relative overflow-hidden ${className}`}>
      <ScrollAreaPrimitive.Viewport
        className={`h-full w-full rounded-[inherit] ${viewportClassName}`}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        className="flex select-none touch-none p-0.5 bg-gray-100 dark:bg-neutral-800 transition-colors duration-150 ease-out hover:bg-muted/20 data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2"
        orientation="vertical"
      >
        <ScrollAreaPrimitive.Thumb className="flex-1 bg-gray-50 dark:bg-neutral-800 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  )
}
