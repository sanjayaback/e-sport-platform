import { NextRequest, NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheets';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    console.log('Testing Google Sheets connection...');
    
    const doc = await getDoc();
    await doc.loadInfo();
    
    console.log('Connected to spreadsheet:', doc.title);
    
    const paymentsSheet = doc.sheetsByTitle['Payments'];
    if (paymentsSheet) {
      const rows = await paymentsSheet.getRows();
      console.log(`Found ${rows.length} payment records`);
      
      const paymentData = rows.map((row: any) => ({
        tournamentId: row.get('tournamentId'),
        userId: row.get('userId'),
        screenshotUrl: row.get('screenshotUrl'),
        status: row.get('status'),
        type: row.get('type'),
        uploadDate: row.get('uploadDate'),
        cloudinaryPublicId: row.get('cloudinaryPublicId')
      }));
      
      return NextResponse.json({
        success: true,
        data: {
          spreadsheetTitle: doc.title,
          paymentsCount: rows.length,
          payments: paymentData
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Payments sheet not found',
        availableSheets: Object.keys(doc.sheetsByTitle)
      });
    }
  } catch (error) {
    console.error('Google Sheets debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
