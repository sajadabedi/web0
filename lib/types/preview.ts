export interface SitePreviewProps {
  sidebarExpanded?: boolean
}

export interface EditingState {
  id: string
  element: HTMLElement
  content: string
  styles: {
    fontSize: string
    color: string
  }
}
