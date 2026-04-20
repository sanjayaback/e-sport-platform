// Simple test to check Google Sheets connection
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Environment check:');
  console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'SET' : 'NOT SET');
  console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'SET' : 'NOT SET');
  console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? 'SET' : 'NOT SET');
  
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID) {
    console.log('All credentials are present');
    
    // Try to import and test
    try {
      const { getDoc } = require('./src/lib/googleSheets.ts');
      console.log('Google Sheets module imported successfully');
      
      const doc = await getDoc();
      await doc.loadInfo();
      console.log('Connected to spreadsheet:', doc.title);
      
      const paymentsSheet = doc.sheetsByTitle['Payments'];
      if (paymentsSheet) {
        const rows = await paymentsSheet.getRows();
        console.log(`Found ${rows.length} rows in Payments sheet`);
        
        if (rows.length > 0) {
          console.log('Sample row data:');
          console.log(JSON.stringify(rows[0].toObject(), null, 2));
        }
      } else {
        console.log('Payments sheet not found');
        console.log('Available sheets:', Object.keys(doc.sheetsByTitle));
      }
    } catch (error) {
      console.error('Error connecting to Google Sheets:', error.message);
    }
  } else {
    console.log('Missing credentials');
  }
}

testConnection();
