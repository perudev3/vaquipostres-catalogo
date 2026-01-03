import { dbPromise } from '../db/indexedDb';

export async function createSale(cart, total, kioskoId) {
  const sale = {
    id: crypto.randomUUID(),
    kiosko_id: kioskoId,
    items: cart,
    total,
    created_at: new Date().toISOString(),
    synced: false,
  };

  const db = await dbPromise;
  await db.put('sales', sale);
  await db.put('sync_queue', sale);

  return sale;
}
