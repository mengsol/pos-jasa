import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const method = url.searchParams.get('method') // cash | cashless | all

  const where: Record<string, unknown> = {}
  if (user.outletId) where.outletId = user.outletId
  const userId = url.searchParams.get('userId')
  if (userId) where.userId = userId
  if (from && to) {
    where.createdAt = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      items: true,
      payments: true,
      user: { select: { name: true } },
      outlet: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  // Filter by payment method group if needed
  if (method === 'cash') {
    return NextResponse.json(transactions.filter(t => t.payments.some(p => p.method === 'cash')))
  }
  if (method === 'cashless') {
    return NextResponse.json(transactions.filter(t => t.payments.every(p => p.method !== 'cash')))
  }

  return NextResponse.json(transactions)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items, payments, note, customerId } = await req.json()

  // Generate invoice number: INV-YYYYMMDD-XXXX
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const count = await prisma.transaction.count({
    where: { invoiceNo: { startsWith: `INV-${today}` } },
  })
  const invoiceNo = `INV-${today}-${String(count + 1).padStart(4, '0')}`

  // Server-side recalculate: fetch active discounts and re-apply
  const now = new Date()
  const activeDiscounts = await prisma.discount.findMany({
    where: { active: true, dateFrom: { lte: now }, dateTo: { gte: now } },
  })

  // Get service details for category lookup
  const serviceIds = items.map((i: { serviceId: string }) => i.serviceId)
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, price: true, categoryId: true },
  })

  // Recalculate each item with current active discounts
  const recalculatedItems = items.map((i: { serviceId: string; serviceName: string; qty: number; price: number; originalPrice?: number; discountPercent?: number; subtotal: number }) => {
    const svc = services.find(s => s.id === i.serviceId)
    if (!svc) return i

    // Calculate discount: item-level + category-level (stacked)
    let totalDiscount = 0
    const itemDisc = activeDiscounts.find(d => d.type === 'service' && d.targetId === svc.id)
    if (itemDisc) totalDiscount += itemDisc.discountPercent
    if (svc.categoryId) {
      const catDisc = activeDiscounts.find(d => d.type === 'category' && d.targetId === svc.categoryId)
      if (catDisc) totalDiscount += catDisc.discountPercent
    }
    totalDiscount = Math.min(totalDiscount, 100)

    const originalPrice = svc.price
    const discountedPrice = totalDiscount > 0 ? Math.round(originalPrice * (1 - totalDiscount / 100)) : originalPrice
    const subtotal = discountedPrice * i.qty

    return {
      serviceId: i.serviceId,
      serviceName: i.serviceName,
      qty: i.qty,
      price: discountedPrice,
      originalPrice,
      discountPercent: totalDiscount,
      subtotal,
    }
  })

  const totalAmount = recalculatedItems.reduce((sum: number, i: { subtotal: number }) => sum + i.subtotal, 0)

  const transaction = await prisma.transaction.create({
    data: {
      invoiceNo,
      outletId: user.outletId || '',
      userId: user.id,
      customerId: customerId || null,
      totalAmount,
      note,
      items: {
        create: recalculatedItems.map((i: { serviceId: string; serviceName: string; qty: number; price: number; originalPrice?: number; discountPercent?: number; subtotal: number }) => ({
          serviceId: i.serviceId,
          serviceName: i.serviceName,
          qty: i.qty,
          price: i.price,
          originalPrice: i.originalPrice || i.price,
          discountPercent: i.discountPercent || 0,
          subtotal: i.subtotal,
        })),
      },
      payments: {
        create: payments.map((p: { method: string; amount: number }) => ({
          method: p.method,
          amount: p.amount,
        })),
      },
    },
    include: { items: true, payments: true },
  })

  return NextResponse.json(transaction)
}
