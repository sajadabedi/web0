import { db } from '@/lib/db'
import { publishedSites } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!params?.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const id = params.id

  const sites = await db
    .select()
    .from(publishedSites)
    .where(eq(publishedSites.id, id))
    .limit(1)
  
  const site = sites[0]

  if (!site) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Clean up any app-specific styles from the HTML but preserve Tailwind classes
  const cleanHtml = site.html
    .replace(/data-[^=]+=["'][^"']*["']/g, '') // Remove all data-* attributes
    .replace(/class=["'][^"']*sonner[^"']*["']/g, '') // Remove classes containing sonner
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
