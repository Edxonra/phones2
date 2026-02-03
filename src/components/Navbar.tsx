'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/src/hooks/useIsAdmin'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
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

    // Escuchar cambios en localStorage
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
    // Limpiar localStorage
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    
    // Actualizar estado
    setIsLoggedIn(false)
    setUser(null)
    setDropdownOpen(false)

    // Disparar evento personalizado
    window.dispatchEvent(new Event('userLoggedOut'))
    
    // Redirigir a home
    router.push('/')
  }

  // No renderizar hasta que esté montado (hydration fix)
  if (!mounted) {
    return (
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={80}
            height={80}
          />
        </Link>
      </nav>
    )
  }

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={80}
          height={80}
        />
      </Link>
      
      <div className="navbar-right">
        {isAdmin && (
          <div className="navbar-admin-menu">
            <Link href="/admin/productos" className="navbar-admin-link">
              Productos
            </Link>
            <Link href="/admin/compras" className="navbar-admin-link">
              Compras
            </Link>
            <Link href="/admin/models" className="navbar-admin-link">
              Modelos
            </Link>
          </div>
        )}
        
        {isLoggedIn && user ? (
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
        ) : (
          <Link href="/login" className="navbar-login">
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  )
}
