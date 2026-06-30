import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isAdminRole } from '@/lib/roles'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: {
      children: {
        where: { active: true },
        orderBy: { name: 'asc' },
        include: {
          children: { where: { active: true }, orderBy: { name: 'asc' } }
        }
      }
    },
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, parentId } = await req.json()
  const category = await prisma.category.create({
    data: { name, parentId: parentId || null },
  })
  return NextResponse.json(category)
}
