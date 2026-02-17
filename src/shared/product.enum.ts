export const STORAGE_OPTIONS = ['128GB', '256GB', '512GB', '1TB', '2TB'] as const
export type Storage = typeof STORAGE_OPTIONS[number]

export const COLOR_OPTIONS = [
  'Negro Espacial',
  'Naranja Cósmico',
  'Gris Espacial',
  'Grafito',
  'Plateado',
  'Azul',
  'Negro',
  'Morado',
  'Azul Sierra',
  'Negro Titanio',
  'Azul Profundo',
  'Gris',
  'Media Noche'
] as const
export type Color = typeof COLOR_OPTIONS[number]

export const BATTERY_OPTIONS = ['85%', '95%', '100%'] as const
export type Battery = typeof BATTERY_OPTIONS[number]

export const CONDITION_OPTIONS = ['Nuevo', 'Seminuevo'] as const
export type Condition = typeof CONDITION_OPTIONS[number]