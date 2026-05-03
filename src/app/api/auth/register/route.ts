import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/auth/register - Register a new user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
      },
    })

    // Auto-create default pipeline stages for the new user
    const defaultStages = [
      { name: 'Nuevo Lead', order: 1, color: '#3b82f6' },
      { name: 'Contactado', order: 2, color: '#8b5cf6' },
      { name: 'Conversación Iniciada', order: 3, color: '#f59e0b' },
      { name: 'Datos Solicitados', order: 4, color: '#06b6d4' },
      { name: 'Propuesta Enviada', order: 5, color: '#f97316' },
      { name: 'Negociación', order: 6, color: '#ec4899' },
      { name: 'Cerrado Ganado', order: 7, color: '#22c55e' },
      { name: 'Cerrado Perdido', order: 8, color: '#ef4444' },
    ]

    await db.$transaction(
      defaultStages.map((stage) =>
        db.pipelineStage.create({
          data: {
            userId: user.id,
            name: stage.name,
            order: stage.order,
            color: stage.color,
          },
        })
      )
    )

    // Return user without password
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Error al registrar usuario', details: String(error) },
      { status: 500 }
    )
  }
}
