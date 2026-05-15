import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.setting.findMany()
  const map: Record<string, string> = {}
  settings.forEach(s => { map[s.key] = s.value })
  return NextResponse.json(map)
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key, value } = await req.json()
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
  return NextResponse.json({ success: true })
}
