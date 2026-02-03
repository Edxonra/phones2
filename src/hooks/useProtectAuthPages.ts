import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useProtectAuthPages() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    
    if (isLoggedIn) {
      // Si está logeado, redirigir a home
      router.push('/')
    } else {
      // Si no está logeado, permitir ver la página
      setIsLoading(false)
    }
  }, [router])

  return isLoading
}
