import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import User from '@/src/lib/models/User'
import connectToDatabase from '@/src/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Conectar a la base de datos
    await connectToDatabase()

    // Obtener los datos del request
    const body = await request.json()
    const { name, email, password } = body

    // Validaciones básicas
    if (!name || !email || !password) {
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

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 400 }
      )
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el nuevo usuario
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
    })

    // Guardar el usuario en la base de datos
    await newUser.save()

    // Retornar éxito (sin exponer la contraseña)
    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al registrar usuario:', error)
    return NextResponse.json(
      { error: 'Error al registrar usuario. Por favor intenta de nuevo.' },
      { status: 500 }
    )
  }
}
