import { dbPromise } from '../db/indexedDb';
import { supabase } from '../supabase';

export async function syncSales() {
  if (!navigator.onLine) return;

  const db = await dbPromise;
  const pending = await db.getAll('sync_queue');

  for (const sale of pending) {
    const { error } = await supabase.from('sales').insert(sale);

    if (!error) {
      await db.delete('sync_queue', sale.id);
    }
  }
}
