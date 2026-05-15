import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user || !user.active) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Password salah' }, { status: 401 })
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    outletId: user.outletId,
  })

  const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } })
  res.cookies.set('pos-token', token, {
    httpOnly: true,
    secure: false, // offline
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
  return res
}
