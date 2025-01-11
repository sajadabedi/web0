import { toast } from 'sonner'
import { useChatStore } from '@/lib/hooks/use-chat'
import { usePreviewStore } from '@/lib/stores/use-preview-store'

export async function handlePublish() {
  const { html, css } = usePreviewStore.getState()
  const { currentHtml, currentCss } = useChatStore.getState()
  
  const rawHtml = html || currentHtml
  if (!rawHtml?.trim()) {
    console.warn('No HTML content to publish')
    toast.error('No content to publish')
    return
  }

  // Create a clean HTML structure
  const contentToPublish = {
    html: rawHtml.trim(),
    css: (css || currentCss || '').trim()
  }

  try {
    const response = await fetch('/api/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentToPublish),
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to publish')
    }

    const { url } = responseData
    toast.success('Published successfully!')
    return url
  } catch (error) {
    console.error('Failed to publish:', error)
    toast.error('Failed to publish')
    return null
  }
}
