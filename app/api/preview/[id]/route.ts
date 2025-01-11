import { db } from '@/lib/db'
import { publishedSites } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

type Props = {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  props: Props
) {
  if (!props.params?.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const id = props.params.id

  const sites = await db
    .select()
    .from(publishedSites)
    .where(eq(publishedSites.id, id))
    .limit(1)
  
  const site = sites[0]

  if (!site) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Preserve all Tailwind classes while cleaning up app-specific attributes
  const cleanHtml = site.html
    .replace(/data-gramm="false"/g, '')
    .replace(/contenteditable="true"/g, '')
    .replace(/data-editable-id="[^"]*"/g, '')
    .replace(/\s+class="\s*"/g, '') // Remove empty class attributes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  // Add wrapper div with base styles
  const wrappedHtml = `
    <div class="container mx-auto px-4 py-8">
      ${cleanHtml}
    </div>
  `

  return NextResponse.json({ 
    html: wrappedHtml, 
    css: site.css || '' 
  })
}
