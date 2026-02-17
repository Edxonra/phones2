export const BRAND_OPTIONS = ['Apple', 'Samsung', 'Google'] as const
export type Brand = typeof BRAND_OPTIONS[number]

export const CATEGORY_OPTIONS = [
  'Smartphone',
  'Laptop',
  'Watch',
  'Tablet',
  'Audio',
] as const
export type Category = typeof CATEGORY_OPTIONS[number]

export const CATEGORY_ITEM_OPTIONS: Record<Category, string[]> = {
  Smartphone: ['iPhone', 'Galaxy', 'Pixel'],
  Laptop: ['MacBook'],
  Watch: ['Apple Watch', 'Galaxy Watch'],
  Tablet: ['iPad', 'Galaxy Tab'],
  Audio: ['AirPods'],
}