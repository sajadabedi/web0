'use client'

import { Toast } from '@/components/ui/toast'
import { LoadingDots } from '../ui/loading-dots'

interface LoadingToastProps {
  isLoading: boolean
  message: string
}

export function LoadingToast({ isLoading, message }: LoadingToastProps) {
  return (
    <Toast open={isLoading}>
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center">
          <LoadingDots />
        </div>
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {message}
        </p>
      </div>
    </Toast>
  )
}
