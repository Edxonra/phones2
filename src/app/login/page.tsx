'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProtectAuthPages } from '@/src/hooks/useProtectAuthPages'

export default function LoginPage() {
  const router = useRouter()
  const isLoading = useProtectAuthPages()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Cargar preferencias guardadas en cookies desde el servidor
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/auth/preferences')
        const data = await response.json()

        if (data.email) {
          setEmail(data.email)
          setRememberMe(true)
        }

        if (data.password) {
          setPassword(data.password)
        }
      } catch (error) {
        console.error('Error al cargar preferencias:', error)
      }
    }

    loadPreferences()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones básicas
    if (!email || !password) {
      setError('Por favor completa todos los campos')
      return
    }

    try {
      // Primero guardar las preferencias en cookies (solo email)
      await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          rememberEmail: rememberMe,
          // ⭐ NO enviamos contraseña por seguridad
        }),
      })

      // Luego hacer el login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión. Por favor intenta de nuevo.')
        return
      }

      // Guardar información del usuario en localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('isLoggedIn', 'true')

      // Disparar evento personalizado
      window.dispatchEvent(new Event('userLoggedIn'))

      // Esperar un poco para que el evento se procese, luego recargar
      setTimeout(() => {
        router.refresh()
        router.push('/')
      }, 100)
    } catch {
      setError('Error al iniciar sesión. Por favor intenta de nuevo.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Iniciar Sesión</h1>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Redirigiendo...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo electrónico"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Recordar mi correo electrónico</label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button">
              Iniciar Sesión
            </button>
          </form>
        )}

        <p className="signup-link">
          ¿No tienes cuenta? <a href="/signup">Regístrate</a>
        </p>
      </div>
    </div>
  )
}
