import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

console.log('\n=== RECENT ORDERS (last 5) ===');
const orders = await p.order.findMany({
  take: 5,
  orderBy: { createdAt: 'desc' },
  select: { id: true, total: true, createdAt: true, storeId: true },
});
for (const o of orders) {
  const ist = o.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`ID: ${o.id.slice(0,8)}... | ₹${o.total} | IST: ${ist}`);
}

console.log('\n=== RECENT SALES (last 5) ===');
const sales = await p.sale.findMany({
  take: 5,
  orderBy: { createdAt: 'desc' },
  select: { id: true, amount: true, createdAt: true, referenceId: true },
});
for (const s of sales) {
  const ist = s.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`RefID: ${s.referenceId.slice(0,8)}... | ₹${s.amount} | IST: ${ist}`);
}

console.log('\n=== MISSING SALES (orders with no Sale record) ===');
const allOrders = await p.order.findMany({
  select: { id: true, total: true, storeId: true, createdAt: true },
});
const allSaleRefs = await p.sale.findMany({
  select: { referenceId: true },
});
const syncedIds = new Set(allSaleRefs.map(s => s.referenceId));
const missing = allOrders.filter(o => !syncedIds.has(o.id));

console.log(`Total orders: ${allOrders.length}`);
console.log(`Total sales:  ${allSaleRefs.length}`);
console.log(`Missing:      ${missing.length}`);

if (missing.length > 0) {
  console.log('\nCreating missing Sale records now...');
  const toCreate = missing.map(o => ({
    storeId:     o.storeId,
    amount:      o.total,
    source:      'ORDER',
    referenceId: o.id,
    createdAt:   o.createdAt,
  }));

  const result = await p.sale.createMany({
    data: toCreate,
    skipDuplicates: true,
  });
  console.log(`✅ Created ${result.count} Sale records`);
} else {
  console.log('✅ All orders already have Sale records');
}

console.log('\n=== FINAL SALE COUNT ===');
const finalCount = await p.sale.count();
console.log('Total sales in DB:', finalCount);

await p.$disconnect();
