'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePreviewStore } from '@/lib/stores/use-preview-store'

export function ThemeToggle() {
  const { theme, toggleTheme, html } = usePreviewStore()
  const hasContent = Boolean(html)

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      disabled={!hasContent}
      title={hasContent ? 'Toggle preview theme' : 'Generate a site first'}
    >
      {theme === 'dark' ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle preview theme</span>
    </Button>
  )
}
