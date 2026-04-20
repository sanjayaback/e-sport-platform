import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { getDoc } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG] Payment screenshot upload called');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tournamentId = formData.get('tournamentId') as string;
    const userId = formData.get('userId') as string;
    
    console.log('[DEBUG] Payment upload params:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      tournamentId,
      userId
    });

    if (!file) {
      return NextResponse.json(
        { error: 'No tournament screenshot file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadOptions = {
      folder: 'esports-platform/tournament-screenshots',
      public_id: tournamentId 
        ? `tournament_${tournamentId}_player_${userId}_${Date.now()}` 
        : `tournament_player_${userId}_${Date.now()}`,
    };

    const result = await uploadImage(buffer, uploadOptions);

    // Save payment screenshot data to Google Sheets Transactions sheet
    try {
      const doc = await getDoc();
      await doc.loadInfo();
      
      const transactionsSheet = doc.sheetsByTitle['Transactions'] || await doc.addSheet({
        title: 'Transactions',
        headerValues: ['_id', 'transactionId', 'userId', 'screenshotUrl', 'cloudinaryId', 'uploadedAt', 'timestamp']
      });
      
      await transactionsSheet.addRow({
        _id: `transaction_payment_${tournamentId}_${userId}_${Date.now()}`,
        transactionId: `payment_${tournamentId}_${userId}`,
        userId: userId,
        screenshotUrl: result.secure_url,
        cloudinaryId: result.public_id,
        uploadedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      console.log('Payment screenshot saved to Google Sheets Transactions:', {
        tournamentId,
        userId,
        screenshotUrl: result.secure_url
      });
    } catch (sheetsError) {
      console.error('Failed to save payment screenshot to Google Sheets Transactions:', sheetsError);
      // Continue with response even if Google Sheets fails
    }

    return NextResponse.json({
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    console.error('Tournament screenshot upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload tournament screenshot' },
      { status: 500 }
    );
  }
}
