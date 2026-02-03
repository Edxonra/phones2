import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import User from '@/src/lib/models/User'
import connectToDatabase from '@/src/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    // Conectar a la base de datos
    await connectToDatabase()

    // Obtener los datos del request
    const body = await request.json()
    const { email, password } = body

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor completa todos los campos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Por favor ingresa un correo electrónico válido' },
        { status: 400 }
      )
    }

    // Buscar el usuario por email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { error: 'Correo electrónico o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Comparar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Correo electrónico o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Retornar éxito con los datos del usuario (incluido el rol)
    return NextResponse.json(
      {
        message: 'Iniciaste sesión exitosamente',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al iniciar sesión:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión. Por favor intenta de nuevo.' },
      { status: 500 }
    )
  }
}
