// ============================================================
// PERUBAHAN DI: src/app/api/transactions/route.ts
// ============================================================
//
// Di function POST, tambahkan `customerId` dari request body:
//
// SEBELUM:
//   const { items, payments, note } = await req.json()
//
// SESUDAH:
//   const { items, payments, note, customerId } = await req.json()
//
// Dan di prisma.transaction.create, tambahkan field customerId:
//
// SEBELUM:
//   data: {
//     invoiceNo,
//     outletId: user.outletId || '',
//     userId: user.id,
//     totalAmount,
//     note,
//     ...
//   }
//
// SESUDAH:
//   data: {
//     invoiceNo,
//     outletId: user.outletId || '',
//     userId: user.id,
//     customerId: customerId || null,  // <-- TAMBAHAN
//     totalAmount,
//     note,
//     ...
//   }
