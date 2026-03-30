require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function listUsers() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const usersSheet = doc.sheetsByTitle['Users'];
    const rows = await usersSheet.getRows();
    
    let users = [];
    for (const r of rows) {
      users.push({
        role: r.get('role'),
        username: r.get('username'),
        email: r.get('email'),
        isSubscribed: r.get('isSubscribed')
      });
    }
    
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    console.log("Written to users.json");
    
  } catch (err) {
    console.error("Failed:", err);
  }
}
listUsers();
