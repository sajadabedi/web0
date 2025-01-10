'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  delayDuration?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export function Tooltip({
  children,
  content,
  delayDuration = 400,
  side = 'top',
  align = 'center',
  sideOffset = 5,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="rounded-md bg-neutral-900 font-medium px-2 py-1 text-xs text-white dark:text-black shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            side={side}
            align={align}
            sideOffset={sideOffset}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
