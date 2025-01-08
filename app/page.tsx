import { ChatInterface } from '@/components/chat/chat-interface'
import { SitePreview } from '@/components/preview/site-preview'

export default function Home() {
  return (
    <div className="flex h-screen">
      {/* Chat Interface */}
      <ChatInterface />

      {/* Preview Area */}
      <main className="flex-1 bg-background p-8 transition-[flex-grow] duration-300 ease-in-out">
        <SitePreview />
      </main>
    </div>
  )
}
