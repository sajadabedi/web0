import { usePreviewStore } from '@/lib/stores/use-preview-store'
import type { EditingState } from '../types/preview'

export function handleSave(
  editingState: EditingState | null,
  content: string,
  styles: { fontSize: string; color: string },
  iframe: HTMLIFrameElement | null
) {
  if (!editingState || !iframe) return

  const doc = iframe.contentDocument
  if (!doc) return

  // Update the element in the iframe
  const element = editingState.element
  element.textContent = content
  element.style.fontSize = styles.fontSize
  element.style.color = styles.color

  // Update store with new content and styles
  usePreviewStore.getState().updateElement(editingState.id, content, styles)

  // Update preview store with the new HTML
  const previewStore = usePreviewStore.getState()
  const cleanHtml = doc.body.innerHTML
    .replace(/contenteditable="true"/g, '')
    .replace(/class=""/g, '')
    .trim()
  previewStore.updatePreview(cleanHtml, previewStore.css || '')
}
