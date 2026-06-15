import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

const orders = await p.order.count();
const sales  = await p.sale.count();
const stores = await p.store.count();
const users  = await p.user.count();

console.log('Orders:', orders);
console.log('Sales: ', sales);
console.log('Stores:', stores);
console.log('Users: ', users);

if (orders > 0 && sales === 0) {
  console.log('\n⚠️  PROBLEM FOUND: Orders exist but Sale table is empty!');
  console.log('👉 FIX: Run the backfill command below:\n');
  console.log('   Add SYNC_SECRET=mysecret123 to your .env file');
  console.log('   Then visit: http://localhost:3000/api/sales/sync?secret=mysecret123\n');
}

if (orders === 0) {
  console.log('\n⚠️  No orders exist yet. Place a test order first, then check analytics.');
}

if (sales > 0) {
  console.log('\n✅ Sale table has data. Analytics should work.');
  console.log('👉 The issue is in the middleware/auth logic.');
}

await p.$disconnect();
