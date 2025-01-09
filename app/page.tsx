import { ChatInterface } from '@/components/chat/chat-interface'
import { SitePreview } from '@/components/preview/site-preview'

export default function Home() {
  return (
    <div className="flex h-screen">
      <ChatInterface />
      <main className="flex-1 p-2 transition-[flex-grow] duration-300 ease-in-out">
        <SitePreview />
      </main>
    </div>
  )
}
