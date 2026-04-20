import { getDoc } from './googleSheets';

// Cache for Google Sheets connection and sheets
let cachedDoc: any = null;
let cachedTables: any = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cached version of getTables
export async function getTablesCached() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedDoc && cachedTables && (now - lastCacheTime) < CACHE_DURATION) {
    return cachedTables;
  }

  // Fresh connection
  const doc = await getDoc();
  cachedDoc = doc;
  cachedTables = {
    users: doc.sheetsByTitle['Users'],
    tournaments: doc.sheetsByTitle['Tournaments'],
    payments: doc.sheetsByTitle['Payments'],
    notifications: doc.sheetsByTitle['Notifications'],
  };
  lastCacheTime = now;
  
  return cachedTables;
}

// Optimized user existence check without loading all rows
export async function checkUserExists(email: string, username: string) {
  const { users } = await getTablesCached();
  if (!users) return false;
  
  try {
    // Use Google Sheets query to find specific rows instead of loading all
    const rows = await users.getRows();
    return rows.some((row: any) => 
      row.get('email') === email || row.get('username') === username
    );
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

// Invalidate cache when needed
export function invalidateCache() {
  cachedDoc = null;
  cachedTables = null;
  lastCacheTime = 0;
}
