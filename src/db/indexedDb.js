import { openDB } from 'idb';

export const dbPromise = openDB('kiosko-pos', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('products')) {
      db.createObjectStore('products', { keyPath: 'id' });
    }

    if (!db.objectStoreNames.contains('sales')) {
      db.createObjectStore('sales', { keyPath: 'id' });
    }

    if (!db.objectStoreNames.contains('sync_queue')) {
      db.createObjectStore('sync_queue', { keyPath: 'id' });
    }
  },
});
