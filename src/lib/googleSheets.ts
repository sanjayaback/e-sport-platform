import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import { createPrivateKey } from 'crypto'

// Mock in-memory storage for development
const mockStorage: Record<string, any[]> = {
  'Users': [
    {
      _id: '1',
      email: 'admin@test.com',
      password: 'dummy.hash.for.development',
      role: 'admin',
      username: 'admin',
      walletBalance: 1000,
      isSubscribed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2', 
      email: 'host@test.com',
      password: 'dummy.hash.for.development',
      role: 'host',
      username: 'testhost',
      walletBalance: 500,
      isSubscribed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '3',
      email: 'player@test.com',
      password: 'dummy.hash.for.development',
      role: 'player',
      username: 'testplayer',
      walletBalance: 100,
      isSubscribed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  'Tournaments': [],
  'Payments': [],
  'Notifications': [],
  'QR Codes': [],
  'Transactions': [],
  'Images': [],
};

// Mock row class for development
class MockRow {
  constructor(private data: any) {}
  
  get(field: string) {
    return this.data[field];
  }
  
  set(field: string, value: any) {
    this.data[field] = value;
  }
  
  save() {
    // Mock save - data is already in memory
    return Promise.resolve();
  }
  
  delete() {
    // Mock delete - would remove from array in real implementation
    return Promise.resolve();
  }
  
  toObject() {
    return this.data;
  }
}

// Mock sheet class for development
class MockSheet {
  constructor(private title: string) {}
  
  async getRows() {
    console.log(`[DEV] Mock: Getting rows from ${this.title}, count: ${mockStorage[this.title].length}`);
    console.log(`[DEV] Mock: First row sample:`, mockStorage[this.title][0]);
    return mockStorage[this.title].map(data => new MockRow(data));
  }
  
  async addRow(row: any) {
    console.log(`[DEV] Mock: Adding row to ${this.title}:`, row);
    mockStorage[this.title].push(row);
  }
  
  async updateRow(rowId: string, updates: any) {
    console.log(`[DEV] Mock: Updating row ${rowId} in ${this.title}:`, updates);
    const rowIndex = mockStorage[this.title].findIndex((row: any) => row._id === rowId);
    if (rowIndex !== -1) {
      mockStorage[this.title][rowIndex] = { ...mockStorage[this.title][rowIndex], ...updates };
      return mockStorage[this.title][rowIndex];
    }
    throw new Error(`Row with ID ${rowId} not found in ${this.title}`);
  }
}

// Mock document class for development
class MockDoc {
  sheetsByTitle: Record<string, MockSheet> = {
    'Users': new MockSheet('Users'),
    'Tournaments': new MockSheet('Tournaments'),
    'Payments': new MockSheet('Payments'),
    'Notifications': new MockSheet('Notifications'),
    'QR Codes': new MockSheet('QR Codes'),
    'Transactions': new MockSheet('Transactions'),
    'Images': new MockSheet('Images'),
  };
  
  async loadInfo() {
    console.log('[DEV] Using mock Google Sheets database with in-memory storage');
  }

  async addSheet({ title, headerValues }: { title: string; headerValues: string[] }) {
    console.log(`[DEV] Mock: Creating new sheet "${title}" with headers:`, headerValues);
    const newSheet = new MockSheet(title);
    this.sheetsByTitle[title] = newSheet;
    return newSheet;
  }
}

function normalizeGooglePrivateKey(rawPrivateKey: string) {
  let privateKey = rawPrivateKey.trim()

  // Some hosts wrap env values in quotes.
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1)
  }

  // Normalize the most escaped variants first so we do not leave stray backslashes behind.
  privateKey = privateKey
    .replace(/\\r\\n/g, '\n')
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')

  if (!privateKey.endsWith('\n')) {
    privateKey += '\n'
  }

  return privateKey
}

function getPrivateKeyDebugSummary(privateKey: string) {
  const lines = privateKey.split('\n').filter(Boolean)

  return {
    hasNewlines: privateKey.includes('\n'),
    startsWithQuote: privateKey.startsWith('"') || privateKey.startsWith("'"),
    endsWithQuote: privateKey.endsWith('"') || privateKey.endsWith("'"),
    length: privateKey.length,
    firstLine: lines[0] ?? '',
    lastLine: lines[lines.length - 1] ?? '',
    lineCount: lines.length,
  }
}

function validateGooglePrivateKey(privateKey: string) {
  try {
    createPrivateKey({ key: privateKey, format: 'pem' })
  } catch (error) {
    const details = getPrivateKeyDebugSummary(privateKey)
    const reason = error instanceof Error ? error.message : String(error)

    throw new Error(
      `GOOGLE_PRIVATE_KEY could not be parsed (${reason}). ` +
      `Summary: ${JSON.stringify(details)}. ` +
      'If you just edited .env.local, restart the Next.js server so it reloads the updated env values.'
    )
  }
}

export async function getDoc() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
     throw new Error("Missing Google Sheets credentials in environment variables");
  }

  try {
    const privateKey = normalizeGooglePrivateKey(process.env.GOOGLE_PRIVATE_KEY)
    validateGooglePrivateKey(privateKey)

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] Private key format check:', getPrivateKeyDebugSummary(privateKey))
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo(); 
    return doc;
  } catch (error) {
    const runtimeMode = process.env.NODE_ENV ?? 'undefined'
    const allowMockFallback =
      runtimeMode !== 'production' ||
      process.env.ALLOW_MOCK_GOOGLE_SHEETS === 'true'

    if (allowMockFallback) {
      console.error('[ERROR] Google Sheets connection failed, falling back to mock mode:', {
        runtimeMode,
        message: error instanceof Error ? error.message : String(error),
      })
      return new MockDoc() as any
    }

    console.error('[ERROR] Google Sheets connection failed in production:', {
      runtimeMode,
      message: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Failed to connect to Google Sheets')
  }
}
