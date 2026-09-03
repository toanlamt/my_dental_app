/**
 * Landing page image metadata
 * Centralized image URLs, dimensions, and loading hints for the landing page
 */

export const landingImages = {
  hero: {
    src: 'https://plus.unsplash.com/premium_photo-1681966962522-546f370bc98e?auto=format&fit=crop&w=900&q=80',
    alt: 'public.hero.imageAlt' as const,
    width: 900,
    height: 1125,
    fetchPriority: 'high' as const,
    sizes: '(min-width: 1024px) 44vw, (min-width: 640px) 70vw, 92vw',
  },
  about: {
    src: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
    alt: 'public.about.imageAlt' as const,
    width: 900,
    height: 720,
    sizes: '(min-width: 1024px) 44vw, (min-width: 640px) 70vw, 92vw',
  },
} as const;
