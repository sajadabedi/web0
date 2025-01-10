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
          'pointer-events-auto flex items-center justify-between space-x-4 overflow-hidden rounded-lg p-4 shadow-lg',
          'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full',
          'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
          'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
          'data-[swipe=cancel]:translate-x-0',
          'data-[swipe=move]:transition-none'
        )}
      >
        {children}
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport />
    </ToastPrimitive.Provider>
  )
}
