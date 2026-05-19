import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const services = await prisma.service.findMany({
    where: { active: true },
    include: { category: { include: { parent: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, price, categoryId, outletId } = await req.json()
  const service = await prisma.service.create({
    data: { name, price, categoryId, outletId },
  })
  return NextResponse.json(service)
}
