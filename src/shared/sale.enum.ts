export const STATUS_OPTIONS = ['Cancelado', 'Pendiente'] as const
export type Status = typeof STATUS_OPTIONS[number]