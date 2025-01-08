const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

interface UnsplashImage {
  url: string
  alt: string
  credit: {
    name: string
    link: string
  }
}

export async function getUnsplashImage(query: string): Promise<UnsplashImage> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch image from Unsplash')
    }

    const data = await response.json()
    return {
      url: data.urls.regular,
      alt: data.alt_description || query,
      credit: {
        name: data.user.name,
        link: data.user.links.html,
      },
    }
  } catch (error) {
    console.error('Error fetching Unsplash image:', error)
    // Fallback to a default image if the API call fails
    return {
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
      alt: query,
      credit: {
        name: 'Unsplash',
        link: 'https://unsplash.com',
      },
    }
  }
}

export async function getMultipleUnsplashImages(
  queries: string[],
  count: number = 1
): Promise<UnsplashImage[]> {
  try {
    const promises = queries.map(query => getUnsplashImage(query))
    return await Promise.all(promises)
  } catch (error) {
    console.error('Error fetching multiple Unsplash images:', error)
    return queries.map(query => ({
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
      alt: query,
      credit: {
        name: 'Unsplash',
        link: 'https://unsplash.com',
      },
    }))
  }
}
