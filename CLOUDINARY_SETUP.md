# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image storage in your e-sports platform.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Once registered, you'll be taken to your dashboard

## 2. Get Your Cloudinary Credentials

From your Cloudinary dashboard:

1. Navigate to **Settings** → **Account**
2. Copy your **Cloud Name**
3. Navigate to **Settings** → **Security**
4. Copy your **API Key** and **API Secret**

## 3. Configure Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
```

Replace the placeholder values with your actual Cloudinary credentials.

## 4. Usage Examples

### Basic Image Upload

```tsx
import ImageUpload from '@/components/ImageUpload';

function MyComponent() {
  const handleUploadSuccess = (image) => {
    console.log('Image uploaded:', image.secure_url);
  };

  return (
    <ImageUpload
      onUploadSuccess={handleUploadSuccess}
      onUploadError={(error) => console.error(error)}
    />
  );
}
```

### QR Code Upload

```tsx
import QRCodeUpload from '@/components/QRCodeUpload';

function TournamentForm() {
  return (
    <QRCodeUpload
      tournamentId="tournament-123"
      onUploadSuccess={(qrCode) => {
        console.log('QR Code uploaded:', qrCode.secure_url);
      }}
    />
  );
}
```

### Transaction Screenshot Upload

```tsx
import TransactionScreenshotUpload from '@/components/TransactionScreenshotUpload';

function PaymentForm() {
  return (
    <TransactionScreenshotUpload
      transactionId="txn-123"
      userId="user-456"
      onUploadSuccess={(screenshot) => {
        console.log('Screenshot uploaded:', screenshot.secure_url);
      }}
    />
  );
}
```

## 5. API Endpoints

The following API endpoints are available:

- `POST /api/upload` - General image upload
- `POST /api/upload/qr` - QR code upload
- `POST /api/upload/transaction` - Transaction screenshot upload
- `DELETE /api/upload` - Delete an image (requires `public_id` in request body)

## 6. Folder Structure

Images are organized in Cloudinary using the following folder structure:

- `esports-platform/qr-codes/` - QR codes
- `esports-platform/transactions/` - Transaction screenshots
- `esports-platform/general/` - General uploads

## 7. File Size Limits

- QR Codes: 2MB max
- Transaction Screenshots: 10MB max
- General Images: 5MB max

## 8. Supported Formats

All common image formats are supported:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- And more...

## 9. Security Notes

- Never commit your `.env.local` file to version control
- The API Secret should only be used server-side
- The Cloud Name and API Key can be exposed to the client
- Consider using signed uploads for additional security in production

## 10. Troubleshooting

### Common Issues

1. **Upload fails with authentication error**
   - Check your environment variables are correctly set
   - Verify your API credentials in Cloudinary dashboard

2. **File too large error**
   - Check file size limits mentioned above
   - Consider image compression before upload

3. **CORS issues**
   - Ensure your Cloudinary account allows uploads from your domain
   - Check the allowed origins in Cloudinary security settings

### Debug Mode

To enable debug logging, you can temporarily modify the Cloudinary config:

```typescript
// In src/lib/cloudinary.ts
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
```
