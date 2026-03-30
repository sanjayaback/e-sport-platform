require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const bcrypt = require('bcryptjs');

async function listUsers() {
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
    
    const usersSheet = doc.sheetsByTitle['Users'];
    const rows = await usersSheet.getRows();
    
    console.log("--- CURRENT USERS IN GOOGLE SHEETS ---");
    let adminExists = false;
    for (const r of rows) {
      console.log(`Role: ${r.get('role').padEnd(8)} | Username: ${r.get('username').padEnd(15)} | Email: ${r.get('email')} | Subscribed?: ${r.get('isSubscribed')}`);
      if (r.get('role') === 'admin') adminExists = true;
    }
    
    if (!adminExists) {
        console.log("\nNo admin found. Creating default admin account...");
        const hashedPassword = await bcrypt.hash('AdminPassword123!', 12);
        await usersSheet.addRow({
          _id: Date.now().toString(),
          username: 'superadmin',
          email: 'admin@killpro.com',
          password: hashedPassword,
          role: 'admin',
          walletBalance: 0,
          isSubscribed: 'true',
          createdAt: new Date().toISOString()
        });
        console.log("Created Admin! Email: admin@killpro.com | Password: AdminPassword123!");
    }
    
  } catch (err) {
    console.error("Failed:", err);
  }
}

listUsers();
