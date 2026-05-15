import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { adminUsername, adminPassword, reason } = await req.json()

  // Check transaction exists and is not already cancelled
  const transaction = await prisma.transaction.findUnique({ where: { id } })
  if (!transaction) {
    return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
  }
  if (transaction.status === 'cancelled') {
    return NextResponse.json({ error: 'Transaksi sudah di-cancel sebelumnya' }, { status: 400 })
  }

  // If session user is admin — no need for admin approval input
  if (session.role === 'admin') {
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelUser: session.name || session.username,
        approvedUser: session.name || session.username,
        cancelDate: new Date(),
        cancelReason: reason,
      },
    })
    return NextResponse.json(updated)
  }

  // If session user is kasir — validate admin credentials
  if (!adminUsername || !adminPassword) {
    return NextResponse.json({ error: 'Username dan password admin wajib diisi' }, { status: 400 })
  }

  const admin = await prisma.user.findUnique({ where: { username: adminUsername } })
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'User admin tidak ditemukan' }, { status: 403 })
  }

  const validPassword = await bcrypt.compare(adminPassword, admin.password)
  if (!validPassword) {
    return NextResponse.json({ error: 'Password admin salah' }, { status: 403 })
  }

  // Cancel the transaction
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      status: 'cancelled',
      cancelUser: session.name || session.username,
      approvedUser: admin.name,
      cancelDate: new Date(),
      cancelReason: reason,
    },
  })

  return NextResponse.json(updated)
}
