import { NextRequest, NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    const { tournamentId, userId, screenshotUrl, cloudinaryPublicId } = await request.json();
    
    console.log('Testing payment screenshot save to Google Sheets...');
    
    const doc = await getDoc();
    await doc.loadInfo();
    
    const paymentsSheet = doc.sheetsByTitle['Payments'];
    if (paymentsSheet) {
      // Add a test payment screenshot record
      await paymentsSheet.addRow({
        tournamentId: tournamentId || 'test-tournament-id',
        userId: userId || 'test-user-id',
        screenshotUrl: screenshotUrl || 'https://test-screenshot-url.com',
        cloudinaryPublicId: cloudinaryPublicId || 'test-public-id',
        uploadDate: new Date().toISOString(),
        status: 'pending',
        type: 'payment'
      });
      
      console.log('Test payment screenshot added to Google Sheets');
      
      // Get all payment records to verify
      const rows = await paymentsSheet.getRows();
      const paymentRecords = rows.filter((row: any) => row.get('type') === 'payment');
      
      return NextResponse.json({
        success: true,
        message: 'Test payment screenshot added successfully',
        totalPaymentRecords: paymentRecords.length,
        latestRecord: paymentRecords[paymentRecords.length - 1]?.toObject()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Payments sheet not found'
      });
    }
  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
