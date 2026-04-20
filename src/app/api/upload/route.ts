import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { getDoc } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'esports-platform';
    const type = formData.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadOptions = {
      folder: `${folder}/${type}`,
      public_id: `${type}_${Date.now()}`,
    };

    const result = await uploadImage(buffer, uploadOptions);

    // Save general image data to Google Sheets
    try {
      const doc = await getDoc();
      await doc.loadInfo();
      
      const imagesSheet = doc.sheetsByTitle['Images'] || await doc.addSheet({
        title: 'Images',
        headerValues: ['_id', 'folder', 'type', 'imageUrl', 'cloudinaryId', 'uploadedAt', 'timestamp']
      });
      
      await imagesSheet.addRow({
        _id: `image_${folder}_${type}_${Date.now()}`,
        folder: folder,
        type: type,
        imageUrl: result.secure_url,
        cloudinaryId: result.public_id,
        uploadedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      console.log('Image saved to Google Sheets:', {
        folder,
        type,
        imageUrl: result.secure_url
      });
    } catch (sheetsError) {
      console.error('Failed to save image to Google Sheets:', sheetsError);
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
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json(
        { error: 'No public_id provided' },
        { status: 400 }
      );
    }

    const result = await import('@/lib/cloudinary').then(
      (module) => module.deleteImage(public_id)
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
