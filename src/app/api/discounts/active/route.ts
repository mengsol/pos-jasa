import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const discounts = await prisma.discount.findMany({
    where: {
      active: true,
      dateFrom: { lte: now },
      dateTo: { gte: now },
    },
  })
  return NextResponse.json(discounts)
}
