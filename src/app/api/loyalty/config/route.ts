import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/loyalty/config
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let config = await prisma.loyaltyConfig.findFirst()
  if (!config) {
    // Create default config
    config = await prisma.loyaltyConfig.create({
      data: { minTransactions: 10, withinDays: 30, claimDaysLimit: 60, isActive: false },
    })
  }
  return NextResponse.json(config)
}

// PUT /api/loyalty/config
export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { minTransactions, withinDays, claimDaysLimit, rewardServiceId, isActive } = await req.json()

  let config = await prisma.loyaltyConfig.findFirst()
  if (config) {
    config = await prisma.loyaltyConfig.update({
      where: { id: config.id },
      data: { minTransactions, withinDays, claimDaysLimit, rewardServiceId, isActive },
    })
  } else {
    config = await prisma.loyaltyConfig.create({
      data: { minTransactions, withinDays, claimDaysLimit, rewardServiceId, isActive },
    })
  }

  return NextResponse.json(config)
}
