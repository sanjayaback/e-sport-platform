'use client';

import React from 'react';
import ImageUpload from './ImageUpload';
import { CloudinaryUploadResult } from '@/lib/cloudinary';

interface TransactionScreenshotUploadProps {
  onUploadSuccess?: (image: CloudinaryUploadResult) => void;
  onUploadError?: (error: string) => void;
  transactionId?: string;
  userId?: string;
  className?: string;
}

export const TransactionScreenshotUpload: React.FC<TransactionScreenshotUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  transactionId,
  userId,
  className = '',
}) => {
  const additionalData: Record<string, string> = {};
  
  if (transactionId) additionalData.transactionId = transactionId;
  if (userId) additionalData.userId = userId;

  return (
    <ImageUpload
      onUploadSuccess={onUploadSuccess}
      onUploadError={onUploadError}
      accept="image/*"
      maxSize={10 * 1024 * 1024} // 10MB for transaction screenshots
      className={className}
      placeholder="Upload Transaction Screenshot (PNG, JPG, etc.)"
      uploadEndpoint="/api/upload/transaction"
      additionalData={additionalData}
    />
  );
};

export default TransactionScreenshotUpload;
