import { getDoc } from './googleSheets';
import bcrypt from 'bcryptjs';

// Helper to wait for doc
export async function getTables() {
  const doc = await getDoc();
  return {
    users: doc.sheetsByTitle['Users'],
    tournaments: doc.sheetsByTitle['Tournaments'],
    payments: doc.sheetsByTitle['Payments'],
    notifications: doc.sheetsByTitle['Notifications'],
  };
}

// Ensure unique ID generation simply with Date.now()
export function generateId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

// Convert cell arrays or JSON back to proper types
export function cleanRow(row: any): Record<string, any> {
  const obj: Record<string, any> = {};
  const rowData = row.toObject();
  
  for (const key of Object.keys(rowData)) {
    let val = row.get(key);
    if (key === 'isSubscribed') val = (val === 'true');
    if (key === 'walletBalance') val = Number(val) || 0;
    obj[key] = val;
  }
  
  // Temporary fix: Ensure host users are always subscribed
  if (obj.role === 'host' && !obj.isSubscribed) {
    obj.isSubscribed = true;
  }
  
  return obj;
}
