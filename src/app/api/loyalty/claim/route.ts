import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/loyalty/claim
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pendingRewardId, transactionId } = await req.json()

  if (!pendingRewardId) {
    return NextResponse.json({ error: 'Pending reward ID required' }, { status: 400 })
  }

  // Verify pending reward exists and is still valid
  const pending = await prisma.pendingReward.findUnique({
    where: { id: pendingRewardId },
  })

  if (!pending) {
    return NextResponse.json({ error: 'Reward tidak ditemukan' }, { status: 404 })
  }

  if (pending.status !== 'pending') {
    return NextResponse.json({ error: 'Reward sudah diklaim atau expired' }, { status: 400 })
  }

  if (new Date() > pending.expiresAt) {
    // Mark as expired
    await prisma.pendingReward.update({
      where: { id: pendingRewardId },
      data: { status: 'expired' },
    })
    return NextResponse.json({ error: 'Reward sudah expired' }, { status: 400 })
  }

  // Claim the reward
  const claimed = await prisma.pendingReward.update({
    where: { id: pendingRewardId },
    data: {
      status: 'claimed',
      claimedAt: new Date(),
      claimTransactionId: transactionId || null,
    },
  })

  // Also create a RewardClaim record for history
  await prisma.rewardClaim.create({
    data: {
      customerId: pending.customerId,
      transactionId: transactionId || null,
    },
  })

  return NextResponse.json({ success: true, claimed })
}
