'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/src/hooks/useIsAdmin'
import { CATEGORY_ITEM_OPTIONS, CATEGORY_OPTIONS } from '@/src/shared/model.enum'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface ProductModel {
  name: string
  brand: string
  category: string
}

interface ProductSearchItem {
  _id: string
  model: ProductModel
  storage?: string
  color?: string
  batteryHealth?: string
  price?: number
}

interface ModelItem {
  _id: string
  name: string
  brand: string
  category: string
}

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<ProductSearchItem[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false)
  const [models, setModels] = useState<ModelItem[]>([])
  const [hasLoadedModels, setHasLoadedModels] = useState(false)
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAdmin } = useIsAdmin()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)

    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
      setIsLoggedIn(loggedIn)

      if (loggedIn) {
        const userData = localStorage.getItem('user')
        if (userData) {
          try {
            setUser(JSON.parse(userData))
          } catch (e) {
            console.error('Error parsing user data:', e)
          }
        }
      } else {
        setUser(null)
      }
    }

    checkLoginStatus()

    const handleStorageChange = () => {
      checkLoginStatus()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userLoggedIn', handleStorageChange)
    window.addEventListener('userLoggedOut', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userLoggedIn', handleStorageChange)
      window.removeEventListener('userLoggedOut', handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    setDropdownOpen(false)

    window.dispatchEvent(new Event('userLoggedOut'))
    router.push('/')
  }

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const filteredResults = useMemo(() => {
    const q = normalize(searchQuery.trim())
    if (!q) return []
    return products.filter((p) => {
      const haystack = normalize(
        `${p.model?.name || ''} ${p.model?.brand || ''} ${p.model?.category || ''} ${p.storage || ''} ${p.color || ''} ${p.batteryHealth || ''}`
      )
      return haystack.includes(q)
    })
  }, [searchQuery, products])

  const groupedCategories = useMemo(() => {
    const map = new Map<string, Set<string>>()
    models.forEach((model) => {
      if (!map.has(model.category)) {
        map.set(model.category, new Set())
      }
      map.get(model.category)?.add(model.brand)
    })
    return CATEGORY_OPTIONS.map((category) => ({
      category,
      brands: CATEGORY_ITEM_OPTIONS[category]?.length
        ? CATEGORY_ITEM_OPTIONS[category]
        : Array.from(map.get(category) ?? []).sort((a, b) => a.localeCompare(b)),
    }))
  }, [models])

  const allBrands = ['iPhone', 'Galaxy', 'Pixel', 'Apple Watch', 'Galaxy Watch', 'iPad', 'Galaxy Tab', 'Airpods', 'Macbook']

  const fetchProducts = async () => {
    if (hasLoadedProducts) return
    setIsSearching(true)
    try {
      const response = await fetch('/api/products?active=true')
      const data = await response.json()
      const list = data?.data ?? data ?? []
      setProducts(list)
      setHasLoadedProducts(true)
    } catch (e) {
      console.error('Error fetching products for search:', e)
    } finally {
      setIsSearching(false)
    }
  }

  const fetchModels = async () => {
    if (hasLoadedModels) return
    try {
      const response = await fetch('/api/models')
      const data = await response.json()
      const list = data?.data ?? data ?? []
      setModels(list)
      setHasLoadedModels(true)
    } catch (e) {
      console.error('Error fetching models for categories:', e)
    }
  }

  const navigateToSearch = (value: string) => {
    const trimmed = value.trim()
    setSearchOpen(false)
    setOpenCategory(null)
    setMobileMenuOpen(false)
    if (trimmed) {
      router.push(`/?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/')
    }
  }

  const toggleCategory = (category: string) => {
    setOpenCategory((current) => (current === category ? null : category))
  }

  const renderAdminLinks = () => (
    <>
      <Link href="/admin/ventas" className="navbar-admin-link" onClick={() => setMobileMenuOpen(false)}>
        Ventas
      </Link>
      <Link href="/admin/pagos" className="navbar-admin-link" onClick={() => setMobileMenuOpen(false)}>
        Pagos
      </Link>
      <Link href="/admin/ganancias" className="navbar-admin-link" onClick={() => setMobileMenuOpen(false)}>
        Ganancias
      </Link>
      <Link href="/admin/compras" className="navbar-admin-link" onClick={() => setMobileMenuOpen(false)}>
        Compras
      </Link>
      <Link href="/admin/productos" className="navbar-admin-link" onClick={() => setMobileMenuOpen(false)}>
        Productos
      </Link>
      <Link href="/admin/clientes" className="navbar-admin-link" onClick={() => setMobileMenuOpen(false)}>
        Clientes
      </Link>
      <Link href="/admin/models" className="navbar-admin-link" onClick={() => setMobileMenuOpen(false)}>
        Modelos
      </Link>
    </>
  )

  useEffect(() => {
    fetchModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted) {
    return (
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          <Image src="/logo.jpg" alt="Logo" width={80} height={80} />
        </Link>
      </nav>
    )
  }

  return (
    <nav className={`navbar ${mobileMenuOpen ? 'navbar-open' : ''}`}>
      <div className="navbar-left">
        <Link href="/" className="navbar-logo">
          <Image src="/logo.jpg" alt="Logo" width={80} height={80} />
        </Link>
        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú de navegación"
        >
          <span className="navbar-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="navbar-toggle-text">Menu</span>
        </button>
        <div className="navbar-mobile-dropdown" aria-hidden={!mobileMenuOpen}>
          <div className="navbar-categories-list navbar-categories-mobile">
            {allBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                className="brand-button-mobile"
                onClick={() => navigateToSearch(brand)}
              >
                {brand}
              </button>
            ))}
          </div>
          {isAdmin && <div className="navbar-admin-menu navbar-admin-menu-mobile">{renderAdminLinks()}</div>}
        </div>
        <div className="navbar-categories-list navbar-categories-desktop">
          {groupedCategories.map((item) => (
            <div
              key={item.category}
              className={`category-item ${openCategory === item.category ? 'open' : ''}`}
            >
              <div className="category-row">
                <button
                  type="button"
                  className="category-link"
                  onClick={() => navigateToSearch(item.category)}
                >
                  {item.category}
                </button>
                <span className="category-label">{item.category}</span>
                <button
                  type="button"
                  className="category-toggle"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleCategory(item.category)
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.opacity = '0.7'
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                  aria-expanded={openCategory === item.category}
                  aria-label={`Ver marcas de ${item.category}`}
                >
                  {openCategory === item.category ? '▲' : '▼'}
                </button>
              </div>
              <div className="category-brands">
                {item.brands.length === 0 ? (
                  <span className="brand-empty">Sin marcas</span>
                ) : (
                  item.brands.map((brand) => (
                    <button
                      type="button"
                      key={brand}
                      className="brand-link"
                      onClick={() => navigateToSearch(brand)}
                    >
                      {brand}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="navbar-search">
        <input
          type="text"
          placeholder="Buscar productos"
          value={searchQuery}
          onFocus={() => {
            setSearchOpen(true)
            if (searchQuery.trim().length >= 1) {
              fetchProducts()
            }
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            navigateToSearch(searchQuery)
          }}
          onChange={(e) => {
            const value = e.target.value
            setSearchQuery(value)
            setSearchOpen(true)
            if (value.trim().length >= 1) {
              fetchProducts()
            }
          }}
        />
        {searchOpen && searchQuery.trim() && (
          <div className="navbar-search-results">
            {isSearching && <div className="search-item">Buscando...</div>}
            {!isSearching && filteredResults.length === 0 && (
              <div className="search-item empty">Sin resultados</div>
            )}
            {!isSearching &&
              filteredResults.slice(0, 8).map((p) => (
                <Link
                  key={p._id}
                  href={`/productos/${p._id}`}
                  className="search-item"
                  onClick={() => setSearchOpen(false)}
                >
                  <div className="search-title">
                    {p.model?.brand} {p.model?.name}
                  </div>
                  <div className="search-subtitle">
                    {p.storage || ''} {p.color || ''}{' '}
                    {p.model?.category ? `• ${p.model.category}` : ''}
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>

      <div className="navbar-right">
        {isAdmin && (
          <div className="navbar-admin-menu navbar-admin-menu-desktop">{renderAdminLinks()}</div>
        )}

        <div className="navbar-actions">
          {isLoggedIn && user ? (
            <>
              <div className="navbar-user-menu">
                <button
                  className="navbar-avatar"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {dropdownOpen && (
                  <div className="navbar-dropdown">
                    <div className="navbar-dropdown-item navbar-user-info">
                      {user.name}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="navbar-dropdown-item navbar-logout-item"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="navbar-login"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="navbar-login-icon" aria-hidden="true">
                  <span className="navbar-login-head" />
                  <span className="navbar-login-body" />
                </span>
                <span className="navbar-login-text">Iniciar Sesión</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
