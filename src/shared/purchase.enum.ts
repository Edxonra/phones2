export const PROVIDER_OPTIONS = ['Apple', 'Samsung', 'BackMarket', 'Amazon', 'Google', 'Otro'] as const
export type Provider = typeof PROVIDER_OPTIONS[number]