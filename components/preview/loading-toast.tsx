'use client'

import { LoadingDots } from '@/components/ui/loading-dots'
import { Toast } from '@/components/ui/toast'

interface LoadingToastProps {
  isLoading: boolean
  message: string
}

export function LoadingToast({ isLoading, message }: LoadingToastProps) {
  return (
    <Toast open={isLoading}>
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center">
          <LoadingDots className="bg-white" />
        </div>
        <p className="text-sm font-medium text-white">{message}</p>
      </div>
    </Toast>
  )
}
