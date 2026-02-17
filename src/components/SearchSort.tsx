'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

export type SearchSortOption = 'bestsellers' | 'price-asc' | 'price-desc'

interface SearchSortProps {
  query: string
  sort: SearchSortOption
}

const OPTIONS: Array<{ value: SearchSortOption; label: string }> = [
  { value: 'bestsellers', label: 'Mas vendidos' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
]

export default function SearchSort({ query, sort }: SearchSortProps) {
  const router = useRouter()
  const normalizedSort = useMemo(() => {
    return OPTIONS.some((option) => option.value === sort) ? sort : 'bestsellers'
  }, [sort])

  const handleChange = (value: SearchSortOption) => {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    params.set('sort', value)
    router.push(`/?${params.toString()}`)
  }

  return (
    <select
      className="search-sort"
      value={normalizedSort}
      onChange={(event) => handleChange(event.target.value as SearchSortOption)}
      aria-label="Ordenar resultados"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
