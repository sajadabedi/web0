import { parse, HTMLElement } from 'node-html-parser'

interface EditableConfig {
  tagName: string
  className?: string
}

const EDITABLE_ELEMENTS: EditableConfig[] = [
  { tagName: 'p' },
  { tagName: 'h1' },
  { tagName: 'h2' },
  { tagName: 'h3' },
  { tagName: 'h4' },
  { tagName: 'h5' },
  { tagName: 'h6' },
  { tagName: 'span' },
  { tagName: 'div', className: 'editable' },
]

export function makeHtmlEditable(htmlContent: string): string {
  const root = parse(htmlContent)
  let editableCounter = 0

  function processNode(node: HTMLElement) {
    if (node.nodeType === 1) { // Element node
      const isEditable = EDITABLE_ELEMENTS.some(config => {
        if (node.tagName.toLowerCase() === config.tagName.toLowerCase()) {
          if (config.className) {
            return node.classList.contains(config.className)
          }
          return true
        }
        return false
      })

      if (isEditable) {
        const elementId = `editable-${editableCounter++}`
        node.setAttribute('data-editable-id', elementId)
      }

      // Process children
      node.childNodes.forEach(child => {
        if (child instanceof HTMLElement) {
          processNode(child)
        }
      })
    }
  }

  root.childNodes.forEach(node => {
    if (node instanceof HTMLElement) {
      processNode(node)
    }
  })

  return root.toString()
}

export function extractEditableContent(html: string): Record<string, string> {
  const root = parse(html)
  const editableContent: Record<string, string> = {}

  function processNode(node: HTMLElement) {
    if (node.nodeType === 1) { // Element node
      const editableId = node.getAttribute('data-editable-id')
      if (editableId) {
        editableContent[editableId] = node.text
      }

      // Process children
      node.childNodes.forEach(child => {
        if (child instanceof HTMLElement) {
          processNode(child)
        }
      })
    }
  }

  root.childNodes.forEach(node => {
    if (node instanceof HTMLElement) {
      processNode(node)
    }
  })

  return editableContent
}
