import { db } from '@/lib/db'
import { publishedSites } from '@/lib/db/schema'
import { nanoid } from 'nanoid'
import { NextResponse, NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'

export interface PublishedSite {
  id: string
  html: string
  css: string | null
  publishedAt: Date
  version: string | null
}

export async function POST(request: NextRequest) {
  try {
    const { html, css = '', version = null } = await request.json()
    
    if (!html) {
      return NextResponse.json(
        { error: 'Missing html' },
        { status: 400 }
      )
    }

    // Clean up any app-specific attributes but preserve style classes
    const cleanHtml = html
      .replace(/data-gramm="false"/g, '')
      .replace(/contenteditable="true"/g, '')
      .replace(/data-editable-id="[^"]*"/g, '')
      .replace(/\s+class="\s*"/g, '') // Remove empty class attributes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    const id = nanoid(10)
    
    await db.insert(publishedSites).values({
      id,
      html: cleanHtml,
      css,
      version,
    })
    
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error publishing site:', error)
    return NextResponse.json(
      { error: 'Failed to publish site' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      )
    }

    const sites = await db
      .select()
      .from(publishedSites)
      .where(eq(publishedSites.id, id))
      .limit(1)
    
    const site = sites[0]
    
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(site)
  } catch (error) {
    console.error('Failed to fetch site:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site' },
      { status: 500 }
    )
  }
}
