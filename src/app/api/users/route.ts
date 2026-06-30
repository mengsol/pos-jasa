import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isAdminRole } from '@/lib/roles'

export async function GET() {
  const user = await getSession()
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      outletId: true,
      active: true,
      createdAt: true,
    },
    orderBy: { username: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { username, password, name, role, outletId } = await req.json()

  if (!username || !password || !name) {
    return NextResponse.json(
      { error: 'Username, password, and name are required' },
      { status: 400 },
    )
  }
  // Only admin & kasir can be created — superadmin is fixed (single, seeded)
  if (role && !['admin', 'kasir'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // check duplicate username
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const created = await prisma.user.create({
    data: {
      username,
      password: hashed,
      name,
      role: role || 'kasir',
      outletId: outletId || null,
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      outletId: true,
      active: true,
      createdAt: true,
    },
  })
  return NextResponse.json(created)
}
