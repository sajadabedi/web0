import { db } from '@/lib/db'
import { publishedSites } from '@/lib/db/schema'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

export interface PublishedSite {
  id: string
  html: string
  css: string
  publishedAt: Date
  version: string | null
}

export async function POST(req: Request) {
  try {
    const { html, css = '', version = null } = await req.json()
    
    if (!html) {
      return NextResponse.json(
        { error: 'No content to publish' },
        { status: 400 }
      )
    }

    const id = nanoid(10)
    
    await db.insert(publishedSites).values({
      id,
      html,
      css,
      version,
    })
    
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to publish site:', error)
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
