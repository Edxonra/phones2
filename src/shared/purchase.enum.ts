export const PROVIDER_OPTIONS = ['Apple', 'Samsung', 'BackMarket', 'Amazon', 'Google'] as const
export type Provider = typeof PROVIDER_OPTIONS[number]