'use client'

import { ChatInterface } from '@/components/chat/chat-interface'
import { SitePreview } from '@/components/preview/site-preview'
import { useState } from 'react'

export default function Home() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  return (
    <main className="flex h-screen bg-[#F4F4F0] dark:bg-neutral-900">
      <ChatInterface isExpanded={sidebarExpanded} onExpandedChange={setSidebarExpanded} />
      <SitePreview sidebarExpanded={sidebarExpanded} />
    </main>
  )
}
