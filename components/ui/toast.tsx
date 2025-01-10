'use client'

import { cn } from '@/lib/utils/tailwind-utils'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { type ReactNode } from 'react'

interface ToastProps {
  open: boolean
  children: ReactNode
}

export function Toast({ open, children }: ToastProps) {
  return (
    <ToastPrimitive.Provider>
      <ToastPrimitive.Root
        open={open}
        className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-md',
          'pointer-events-auto flex items-center justify-between space-x-4 overflow-hidden rounded-lg px-3 py-2.5 drop-shadow-2xl',
          'bg-neutral-900 dark:bg-neutral-700'
        )}
      >
        {children}
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport />
    </ToastPrimitive.Provider>
  )
}
