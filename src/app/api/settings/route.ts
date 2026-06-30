import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isAdminRole, isSuperadminRole } from '@/lib/roles'

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
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key, value } = await req.json()

  // Branding settings can only be changed by superadmin
  const BRANDING_KEYS = ['shop_name', 'pos_logo_image']
  if (BRANDING_KEYS.includes(key) && !isSuperadminRole(user.role)) {
    return NextResponse.json({ error: 'Hanya Super Admin yang dapat mengubah branding' }, { status: 403 })
  }

  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
  return NextResponse.json({ success: true })
}
