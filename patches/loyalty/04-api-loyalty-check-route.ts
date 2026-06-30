// FILE: src/app/api/loyalty/check/route.ts
// Cek apakah pelanggan eligible untuk reward (dengan pending reward system)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/loyalty/check?customerId=xxx
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const customerId = url.searchParams.get('customerId')

  if (!customerId) {
    return NextResponse.json({ eligible: false, reason: 'No customer ID' })
  }

  // Get loyalty config
  const config = await prisma.loyaltyConfig.findFirst()
  if (!config || !config.isActive) {
    return NextResponse.json({ eligible: false, reason: 'Loyalty program tidak aktif' })
  }

  const now = new Date()

  // 1. Cek apakah ada pending reward yang masih valid (belum expired, belum diklaim)
  const pendingReward = await prisma.pendingReward.findFirst({
    where: {
      customerId,
      status: 'pending',
      expiresAt: { gt: now }, // belum expired
    },
    orderBy: { unlockedAt: 'desc' },
  })

  if (pendingReward) {
    // Ada reward yang sudah unlocked dan masih bisa diklaim
    let rewardService = null
    if (config.rewardServiceId) {
      rewardService = await prisma.service.findUnique({
        where: { id: config.rewardServiceId },
        select: { id: true, name: true, price: true },
      })
    }

    return NextResponse.json({
      eligible: true,
      hasUnclaimedReward: true,
      pendingRewardId: pendingReward.id,
      unlockedAt: pendingReward.unlockedAt,
      expiresAt: pendingReward.expiresAt,
      transactionCount: config.minTransactions, // sudah tercapai
      required: config.minTransactions,
      remaining: 0,
      withinDays: config.withinDays,
      claimDaysLimit: config.claimDaysLimit,
      rewardService,
    })
  }

  // 2. Expire pending rewards yang sudah lewat batas waktu
  await prisma.pendingReward.updateMany({
    where: {
      customerId,
      status: 'pending',
      expiresAt: { lte: now },
    },
    data: { status: 'expired' },
  })

  // 3. Hitung transaksi dalam window untuk cek apakah baru eligible
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - config.withinDays)

  // Cari last claim atau last pending reward (yang sudah diklaim/expired) sebagai titik reset
  const lastReset = await prisma.pendingReward.findFirst({
    where: { customerId },
    orderBy: { unlockedAt: 'desc' },
  })

  // Count transaksi setelah last reset (atau dalam window, mana yang lebih baru)
  const countSince = lastReset && lastReset.unlockedAt > sinceDate
    ? lastReset.unlockedAt
    : sinceDate

  const transactionCount = await prisma.transaction.count({
    where: {
      customerId,
      status: 'completed',
      createdAt: { gte: countSince },
    },
  })

  const eligible = transactionCount >= config.minTransactions

  // 4. Jika baru eligible, buat PendingReward (unlock!)
  if (eligible) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + config.claimDaysLimit)

    const newPending = await prisma.pendingReward.create({
      data: {
        customerId,
        expiresAt,
      },
    })

    let rewardService = null
    if (config.rewardServiceId) {
      rewardService = await prisma.service.findUnique({
        where: { id: config.rewardServiceId },
        select: { id: true, name: true, price: true },
      })
    }

    return NextResponse.json({
      eligible: true,
      hasUnclaimedReward: true,
      pendingRewardId: newPending.id,
      unlockedAt: newPending.unlockedAt,
      expiresAt: newPending.expiresAt,
      transactionCount,
      required: config.minTransactions,
      remaining: 0,
      withinDays: config.withinDays,
      claimDaysLimit: config.claimDaysLimit,
      rewardService,
    })
  }

  // 5. Belum eligible
  return NextResponse.json({
    eligible: false,
    hasUnclaimedReward: false,
    transactionCount,
    required: config.minTransactions,
    remaining: Math.max(0, config.minTransactions - transactionCount),
    withinDays: config.withinDays,
    claimDaysLimit: config.claimDaysLimit,
    rewardService: null,
  })
}
