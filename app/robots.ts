import type { MetadataRoute } from 'next'

/**
 * noindex global au lancement : on interdit tout crawl tant que la marque
 * n'est pas prête à être indexée (décision plan). À ouvrir plus tard pour la landing
 * et les sites clients (qui, eux, ont intérêt à être indexés).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  }
}
