import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(discounts)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { type, targetId, targetName, discountPercent, dateFrom, dateTo } = await req.json()

  // Validation: dateFrom must be <= dateTo
  if (new Date(dateFrom) > new Date(dateTo)) {
    return NextResponse.json({ error: 'Tanggal awal tidak boleh lebih besar dari tanggal akhir' }, { status: 400 })
  }

  // Validation: check overlapping discount for same target
  const overlap = await prisma.discount.findFirst({
    where: {
      type,
      targetId,
      active: true,
      OR: [
        { dateFrom: { lte: new Date(dateTo) }, dateTo: { gte: new Date(dateFrom) } },
      ],
    },
  })

  if (overlap) {
    return NextResponse.json({ error: `Diskon untuk item ini sudah ada di periode ${overlap.dateFrom.toISOString().slice(0,10)} s/d ${overlap.dateTo.toISOString().slice(0,10)}` }, { status: 400 })
  }

  const discount = await prisma.discount.create({
    data: {
      type,
      targetId,
      targetName,
      discountPercent: parseFloat(discountPercent),
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    },
  })

  return NextResponse.json(discount)
}
