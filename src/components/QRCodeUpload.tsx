'use client';

import React from 'react';
import ImageUpload from './ImageUpload';
import { CloudinaryUploadResult } from '@/lib/cloudinary';

interface QRCodeUploadProps {
  onUploadSuccess?: (image: CloudinaryUploadResult) => void;
  onUploadError?: (error: string) => void;
  tournamentId?: string;
  className?: string;
}

export const QRCodeUpload: React.FC<QRCodeUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  tournamentId,
  className = '',
}) => {
  const additionalData: Record<string, string> = tournamentId ? { tournamentId } : {};

  return (
    <ImageUpload
      onUploadSuccess={onUploadSuccess}
      onUploadError={onUploadError}
      accept="image/*"
      maxSize={2 * 1024 * 1024} // 2MB for QR codes
      className={className}
      placeholder="Upload QR Code (PNG, JPG, etc.)"
      uploadEndpoint="/api/upload/qr"
      additionalData={additionalData}
    />
  );
};

export default QRCodeUpload;
