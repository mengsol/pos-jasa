import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { username, password, name, role, outletId } = await req.json()

  if (role && !['admin', 'kasir'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // prevent self-demote: admin tidak boleh ubah role sendiri jadi bukan admin
  if (id === session.id && role && role !== 'admin') {
    return NextResponse.json(
      { error: 'Cannot change your own role from admin' },
      { status: 400 },
    )
  }

  // check username unique kalau diganti
  if (username) {
    const other = await prisma.user.findFirst({
      where: { username, NOT: { id } },
    })
    if (other) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }
  }

  const data: Record<string, unknown> = {}
  if (username) data.username = username
  if (name) data.name = name
  if (role) data.role = role
  if (outletId !== undefined) data.outletId = outletId || null
  if (password && password.trim() !== '') {
    data.password = await bcrypt.hash(password, 10)
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
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
  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // prevent self-delete
  if (id === session.id) {
    return NextResponse.json(
      { error: 'Cannot delete your own account' },
      { status: 400 },
    )
  }

  // soft delete — set active=false, biar foreign key transactions tetap valid
  await prisma.user.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
