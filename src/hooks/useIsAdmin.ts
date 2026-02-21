import { useState, useEffect } from 'react'

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          setIsAdmin(user.role === 'admin')
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setIsLoading(false)
    }

    checkAdmin()

    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      checkAdmin()
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

  return { isAdmin, isLoading }
}
