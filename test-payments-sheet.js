const { getDoc } = require('./src/lib/googleSheets.ts');

async function testPaymentsSheet() {
  try {
    console.log('Testing Google Sheets Payments sheet...');
    const doc = await getDoc();
    await doc.loadInfo();
    
    console.log('Connected to spreadsheet:', doc.title);
    
    const paymentsSheet = doc.sheetsByTitle['Payments'];
    if (paymentsSheet) {
      const rows = await paymentsSheet.getRows();
      console.log(`Found ${rows.length} payment records in Google Sheets:`);
      
      rows.forEach((row, index) => {
        console.log(`Payment ${index + 1}:`, {
          tournamentId: row.get('tournamentId'),
          userId: row.get('userId'),
          screenshotUrl: row.get('screenshotUrl'),
          status: row.get('status'),
          type: row.get('type'),
          uploadDate: row.get('uploadDate')
        });
      });
    } else {
      console.log('Payments sheet not found');
    }
  } catch (error) {
    console.error('Error testing Payments sheet:', error);
  }
}

testPaymentsSheet();
