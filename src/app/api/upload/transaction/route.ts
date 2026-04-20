import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { getDoc } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const transactionId = formData.get('transactionId') as string;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No transaction screenshot file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadOptions = {
      folder: 'esports-platform/transactions',
      public_id: transactionId 
        ? `transaction_${transactionId}_${Date.now()}` 
        : `transaction_${userId}_${Date.now()}`,
    };

    const result = await uploadImage(buffer, uploadOptions);

    // Save transaction screenshot data to Google Sheets
    try {
      const doc = await getDoc();
      await doc.loadInfo();
      
      const transactionsSheet = doc.sheetsByTitle['Transactions'] || await doc.addSheet({
        title: 'Transactions',
        headerValues: ['_id', 'transactionId', 'userId', 'screenshotUrl', 'cloudinaryId', 'uploadedAt', 'timestamp']
      });
      
      await transactionsSheet.addRow({
        _id: `transaction_${transactionId || 'unknown'}_${userId}_${Date.now()}`,
        transactionId: transactionId || '',
        userId: userId || '',
        screenshotUrl: result.secure_url,
        cloudinaryId: result.public_id,
        uploadedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      console.log('Transaction screenshot saved to Google Sheets:', {
        transactionId,
        userId,
        screenshotUrl: result.secure_url
      });
    } catch (sheetsError) {
      console.error('Failed to save transaction screenshot to Google Sheets:', sheetsError);
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
    console.error('Transaction screenshot upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload transaction screenshot' },
      { status: 500 }
    );
  }
}
