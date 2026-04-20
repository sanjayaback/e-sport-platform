const { getDoc } = require('./src/lib/googleSheets.ts');

async function testGoogleSheets() {
  try {
    console.log('Testing Google Sheets connection...');
    const doc = await getDoc();
    await doc.loadInfo();
    
    console.log('Connected to spreadsheet:', doc.title);
    
    const usersSheet = doc.sheetsByTitle['Users'];
    if (usersSheet) {
      const rows = await usersSheet.getRows();
      console.log(`Found ${rows.length} users in Google Sheets:`);
      
      rows.forEach((row, index) => {
        console.log(`User ${index + 1}:`, {
          id: row.get('_id'),
          username: row.get('username'),
          email: row.get('email'),
          role: row.get('role'),
          createdAt: row.get('createdAt')
        });
      });
    } else {
      console.log('Users sheet not found');
    }
  } catch (error) {
    console.error('Error testing Google Sheets:', error);
  }
}

testGoogleSheets();
