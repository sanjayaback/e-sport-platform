require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function test() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    console.log("Success! Document loaded:", doc.title);
    
    // Check required sheets
    const requiredSheets = ['Users', 'Tournaments', 'Payments', 'Notifications'];
    for (const name of requiredSheets) {
      if (doc.sheetsByTitle[name]) {
        console.log(`- Sheet '${name}' exists.`);
        const rows = await doc.sheetsByTitle[name].getRows();
        console.log(`  -> Row count: ${rows.length}`);
      } else {
        console.error(`- Sheet '${name}' is MISSING!`);
        console.log('Available sheets:', Object.keys(doc.sheetsByTitle));
      }
    }
  } catch (err) {
    console.error("Failed to connect:", err);
  }
}

test();
