import { cn } from '@/lib/utils/tailwind-utils'

interface LoadingDotsProps {
  className?: string
}
export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'h-3 w-3 rounded-full bg-black dark:bg-white animate-[scale_1s_ease-in-out_infinite]',
          className
        )}
      />
    </div>
  )
}
