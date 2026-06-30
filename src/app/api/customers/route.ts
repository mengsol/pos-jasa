import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/customers?phone=08xx — search by phone
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const phone = url.searchParams.get('phone')

  if (phone) {
    const customer = await prisma.customer.findUnique({ where: { phone } })
    return NextResponse.json(customer)
  }

  // List all customers (for admin)
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' },
    take: 100,
  })
  return NextResponse.json(customers)
}

// POST /api/customers — create new customer
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, note } = await req.json()

  if (!name || !phone) {
    return NextResponse.json({ error: 'Nama dan No HP wajib diisi' }, { status: 400 })
  }

  // Check if phone already exists
  const existing = await prisma.customer.findUnique({ where: { phone } })
  if (existing) {
    return NextResponse.json(existing) // return existing customer
  }

  const customer = await prisma.customer.create({
    data: { name, phone, note },
  })
  return NextResponse.json(customer)
}
