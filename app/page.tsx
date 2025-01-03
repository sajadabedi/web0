import { ChatInterface } from './components/chat/chat-interface'
import { SitePreview } from './components/preview/site-preview'

export default function Home() {
  return (
    <div className="flex h-screen">
      {/* Preview Area */}
      <main className="flex-1 bg-background p-8">
        <SitePreview />
      </main>

      {/* Chat Interface */}
      <ChatInterface />
    </div>
  )
}
