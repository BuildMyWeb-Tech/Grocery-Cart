import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

// Get last 5 sales with timestamps
const sales = await p.sale.findMany({
  take: 5,
  orderBy: { createdAt: 'desc' },
  select: { amount: true, createdAt: true, referenceId: true },
});

console.log('\n=== LAST 5 SALE RECORDS ===');
for (const s of sales) {
  const utc = s.createdAt.toISOString();
  const ist = s.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`Amount: ₹${s.amount} | UTC: ${utc} | IST: ${ist}`);
}

// What does "today IST" mean in UTC right now?
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const nowIST = new Date(Date.now() + IST_OFFSET_MS);
const startIST = new Date(nowIST);
startIST.setUTCHours(0, 0, 0, 0);
const startUTC = new Date(startIST.getTime() - IST_OFFSET_MS);

const endIST = new Date(nowIST);
endIST.setUTCHours(23, 59, 59, 999);
const endUTC = new Date(endIST.getTime() - IST_OFFSET_MS);

console.log('\n=== TODAY IST FILTER BOUNDARIES ===');
console.log('Today starts (UTC):', startUTC.toISOString());
console.log('Today ends   (UTC):', endUTC.toISOString());
console.log('Now IST:', nowIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

// Count how many sales fall in "today IST"
const todaySales = await p.sale.findMany({
  where: { createdAt: { gte: startUTC, lte: endUTC } },
  select: { amount: true, createdAt: true },
});

console.log('\n=== SALES IN TODAY IST ===');
console.log('Count:', todaySales.length);
console.log('Total:', todaySales.reduce((s, x) => s + x.amount, 0));
for (const s of todaySales) {
  console.log(' -', s.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), '₹' + s.amount);
}

// Also check with OLD (wrong) UTC filter for comparison
const startOldUTC = new Date();
startOldUTC.setHours(0, 0, 0, 0);
const endOldUTC = new Date();
endOldUTC.setHours(23, 59, 59, 999);

const oldSales = await p.sale.findMany({
  where: { createdAt: { gte: startOldUTC, lte: endOldUTC } },
  select: { amount: true, createdAt: true },
});

console.log('\n=== SALES WITH OLD UTC FILTER (wrong) ===');
console.log('Count:', oldSales.length);
console.log('Total:', oldSales.reduce((s, x) => s + x.amount, 0));

await p.$disconnect();
