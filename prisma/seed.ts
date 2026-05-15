import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default outlet
  const outlet = await prisma.outlet.upsert({
    where: { id: 'default-outlet' },
    update: {},
    create: {
      id: 'default-outlet',
      name: 'Outlet Utama',
      address: 'Jl. Contoh No. 1',
      phone: '021-1234567',
    },
  })

  // Create admin user (password: admin123)
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hash,
      name: 'Administrator',
      role: 'admin',
      outletId: outlet.id,
    },
  })

  // Create kasir user (password: kasir123)
  const hashKasir = await bcrypt.hash('kasir123', 10)
  await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      username: 'kasir',
      password: hashKasir,
      name: 'Kasir 1',
      role: 'kasir',
      outletId: outlet.id,
    },
  })

  // Create sample categories
  const cat1 = await prisma.category.create({ data: { name: 'Perawatan' } })
  const cat2 = await prisma.category.create({ data: { name: 'Konsultasi' } })

  // Create sample services
  await prisma.service.createMany({
    data: [
      { name: 'Potong Rambut', price: 50000, categoryId: cat1.id, outletId: outlet.id },
      { name: 'Creambath', price: 100000, categoryId: cat1.id, outletId: outlet.id },
      { name: 'Hair Coloring', price: 250000, categoryId: cat1.id, outletId: outlet.id },
      { name: 'Konsultasi Umum', price: 75000, categoryId: cat2.id, outletId: outlet.id },
    ],
  })

  console.log('Seed completed!')
  console.log('Login: admin / admin123 (admin)')
  console.log('Login: kasir / kasir123 (kasir)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
