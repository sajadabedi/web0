export function injectStylesIntoIframe(iframe: HTMLIFrameElement, css: string) {
  const doc = iframe.contentDocument
  if (!doc) return

  let styleTag = doc.querySelector('style#injected-styles')
  if (!styleTag) {
    styleTag = doc.createElement('style')
    styleTag.id = 'injected-styles'
    doc.head.appendChild(styleTag)
  }
  styleTag.textContent = css
}

export function injectHtmlIntoIframe(iframe: HTMLIFrameElement, html: string) {
  const doc = iframe.contentDocument
  if (!doc) return

  doc.body.innerHTML = html
  
  // Add necessary meta tags
  const meta = doc.createElement('meta')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', 'width=device-width, initial-scale=1.0')
  doc.head.appendChild(meta)
}
