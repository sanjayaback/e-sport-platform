import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { getTables } from '@/lib/db';
import { getDoc } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tournamentId = formData.get('tournamentId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No QR code file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadOptions = {
      folder: 'esports-platform/qr-codes',
      public_id: tournamentId ? `qr_${tournamentId}_${Date.now()}` : `qr_${Date.now()}`,
    };

    const result = await uploadImage(buffer, uploadOptions);

    // Update tournament's hostQRCodeURL if tournamentId is provided
    if (tournamentId) {
      try {
        const { tournaments } = await getTables();
        const rows = await tournaments.getRows();
        const tournamentRow = rows.find((r: any) => r.get('_id') === tournamentId);
        
        if (tournamentRow) {
          tournamentRow.set('hostQRCodeURL', result.secure_url);
          await tournamentRow.save();
          console.log('Updated tournament hostQRCodeURL:', {
            tournamentId,
            qrCodeUrl: result.secure_url
          });
        } else {
          console.warn('Tournament not found for QR code update:', tournamentId);
        }
      } catch (updateError) {
        console.error('Failed to update tournament with QR code URL:', updateError);
        // Continue with response even if tournament update fails
      }
    }

    // Save QR code data to Google Sheets
    try {
      const doc = await getDoc();
      await doc.loadInfo();
      
      const qrCodesSheet = doc.sheetsByTitle['QR Codes'] || await doc.addSheet({
        title: 'QR Codes',
        headerValues: ['_id', 'tournamentId', 'qrCodeUrl', 'cloudinaryId', 'uploadedAt', 'timestamp']
      });
      
      await qrCodesSheet.addRow({
        _id: `qr_${tournamentId || 'general'}_${Date.now()}`,
        tournamentId: tournamentId || '',
        qrCodeUrl: result.secure_url,
        cloudinaryId: result.public_id,
        uploadedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      console.log('QR code saved to Google Sheets:', {
        tournamentId,
        qrCodeUrl: result.secure_url
      });
    } catch (sheetsError) {
      console.error('Failed to save QR code to Google Sheets:', sheetsError);
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
    console.error('QR upload error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to upload QR code', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
