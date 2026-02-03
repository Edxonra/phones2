import { NextRequest, NextResponse } from 'next/server'
import { encryptData, decryptData } from '@/src/lib/encryption'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, rememberEmail } = body

    const response = NextResponse.json(
      { message: 'Preferencias guardadas de forma segura' },
      { status: 200 }
    )

    // Configurar cookies con opciones SEGURAS
    const cookieOptions = {
      httpOnly: true, // ⭐ NO accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 días
      path: '/',
    }

    // Guardar email encriptado si está marcado
    if (rememberEmail && email) {
      const encryptedEmail = encryptData(email)
      response.cookies.set('rememberedEmail', encryptedEmail, cookieOptions)
    } else {
      response.cookies.delete('rememberedEmail')
    }

    // ⭐ NO guardamos contraseña por seguridad
    response.cookies.delete('rememberedPassword')

    return response
  } catch (error) {
    console.error('Error al guardar preferencias:', error)
    return NextResponse.json(
      { error: 'Error al guardar preferencias' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Leer las cookies del servidor (httpOnly)
    const rememberedEmailCookie = request.cookies.get('rememberedEmail')?.value

    let decryptedEmail = ''
    if (rememberedEmailCookie) {
      try {
        decryptedEmail = decryptData(rememberedEmailCookie)
      } catch (err) {
        console.error('Error al desencriptar email:', err)
        // Si hay error al desencriptar, borrar la cookie
        const response = NextResponse.json({ email: '' })
        response.cookies.delete('rememberedEmail')
        return response
      }
    }

    return NextResponse.json({
      email: decryptedEmail,
      // ⭐ NUNCA devolvemos la contraseña por seguridad
      password: '',
    })
  } catch (error) {
    console.error('Error al leer preferencias:', error)
    return NextResponse.json(
      { error: 'Error al leer preferencias' },
      { status: 500 }
    )
  }
}
