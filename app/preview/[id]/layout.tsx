import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Preview - G0 Builder',
  description: 'Preview your website built with G0 Builder',
}

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
