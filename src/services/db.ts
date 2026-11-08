/**
 * Factory Data - Local IndexedDB Storage Service
 * 100% offline, local-to-device persistence without any cloud dependency.
 */

import { FactorySettings } from '../types';

const DB_NAME = 'FactoryData_LocalDB';
const DB_VERSION = 1;

export const STORES = [
  'settings',
  'employees',
  'deductions',
  'bonuses',
  'payrolls',
  'equipment',
  'machines',
  'maintenances',
  'inventory',
  'inventoryMovements',
  'workInProgress',
  'finishedProducts',
  'productSales',
  'tools',
  'capitalTransactions',
  'expenses',
  'revenues',
  'withdrawals',
] as const;

export type StoreName = typeof STORES[number];

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Ensure initial default factory settings exist
      try {
        await initDefaultSettings(db);
      } catch (err) {
        console.error('Error initializing default settings:', err);
      }

      resolve(db);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

const DEFAULT_SETTINGS_ID = 'factory_primary_settings';

export const INITIAL_FACTORY_SETTINGS: FactorySettings & { id: string } = {
  id: DEFAULT_SETTINGS_ID,
  factoryName: 'Factory Data',
  address: 'المنطقة الصناعية - مصنع الإنتاج الرئيسي',
  phone: '+201000000000',
  taxNumber: '123-456-789',
  commercialRegistration: '987654',
  currency: 'جنيه مصري',
  currencySymbol: 'ج.م',
  customCategories: [],
  currentUserRole: 'admin',
  createdAt: new Date().toISOString(),
};

async function initDefaultSettings(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const getReq = store.get(DEFAULT_SETTINGS_ID);

    getReq.onsuccess = () => {
      if (!getReq.result) {
        store.put(INITIAL_FACTORY_SETTINGS);
      }
      resolve();
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Generic CRUD operations on IndexedDB
 */
export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getByIdFromStore<T>(storeName: StoreName, id: string): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result ? (req.result as T) : null);
    req.onerror = () => reject(req.error);
  });
}

export async function putInStore<T extends { id: string }>(storeName: StoreName, item: T): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);

    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFromStore(storeName: StoreName, id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Settings helpers
 */
export async function getSettings(): Promise<FactorySettings> {
  const result = await getByIdFromStore<FactorySettings & { id: string }>('settings', DEFAULT_SETTINGS_ID);
  return result || INITIAL_FACTORY_SETTINGS;
}

export async function saveSettings(settings: Partial<FactorySettings>): Promise<FactorySettings> {
  const current = await getSettings();
  const updated: FactorySettings & { id: string } = {
    ...current,
    ...settings,
    id: DEFAULT_SETTINGS_ID,
  };
  await putInStore('settings', updated);
  return updated;
}

/**
 * Complete Database Backup & Restore
 */
export interface CompleteBackupPayload {
  version: number;
  appName: string;
  exportedAt: string;
  data: Record<StoreName, unknown[]>;
}

export async function exportFullDatabase(): Promise<CompleteBackupPayload> {
  const backup: Record<string, unknown[]> = {};

  for (const storeName of STORES) {
    const items = await getAllFromStore(storeName);
    backup[storeName] = items;
  }

  return {
    version: DB_VERSION,
    appName: 'Factory Data',
    exportedAt: new Date().toISOString(),
    data: backup as Record<StoreName, unknown[]>,
  };
}

export async function importFullDatabase(payload: CompleteBackupPayload): Promise<void> {
  if (!payload || !payload.data) {
    throw new Error('ملف النسخة الاحتياطية غير صالح أو تالف');
  }

  const db = await openDatabase();

  for (const storeName of STORES) {
    const items = payload.data[storeName];
    if (Array.isArray(items)) {
      await clearStore(storeName);
      
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      for (const item of items) {
        store.put(item);
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  // Ensure default settings exist after import
  await initDefaultSettings(db);
}

/**
 * Storage metrics
 */
export async function getStorageStats(): Promise<{
  recordCounts: Record<string, number>;
  totalRecords: number;
  estimatedSizeKb: number;
}> {
  const recordCounts: Record<string, number> = {};
  let totalRecords = 0;
  let totalJsonLength = 0;

  for (const storeName of STORES) {
    const items = await getAllFromStore(storeName);
    recordCounts[storeName] = items.length;
    totalRecords += items.length;
    totalJsonLength += JSON.stringify(items).length;
  }

  const estimatedSizeKb = Math.round(totalJsonLength / 1024);

  return {
    recordCounts,
    totalRecords,
    estimatedSizeKb,
  };
}
