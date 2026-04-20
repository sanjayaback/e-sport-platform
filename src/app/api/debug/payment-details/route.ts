import { NextRequest, NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheets';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    const doc = await getDoc();
    await doc.loadInfo();
    
    const paymentsSheet = doc.sheetsByTitle['Payments'];
    if (paymentsSheet) {
      const rows = await paymentsSheet.getRows();
      
      // Get all payment type records with full details
      const paymentRecords = rows
        .filter((row: any) => row.get('type') === 'payment')
        .map((row: any) => {
          const rowData = row.toObject();
          return {
            _id: rowData._id,
            playerId: rowData.playerId,
            tournamentId: rowData.tournamentId,
            amount: rowData.amount,
            status: rowData.status,
            type: rowData.type,
            notes: rowData.notes, // This should contain the Cloudinary URL
            timestamp: rowData.timestamp
          };
        });
      
      return NextResponse.json({
        success: true,
        data: {
          totalPaymentRecords: paymentRecords.length,
          paymentRecords: paymentRecords
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Payments sheet not found'
      });
    }
  } catch (error) {
    console.error('Payment details debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
