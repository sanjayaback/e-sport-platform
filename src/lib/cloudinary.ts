import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
  resource_type: string;
}

export const uploadImage = async (
  file: string | Buffer,
  options?: {
    folder?: string;
    resource_type?: 'image' | 'auto';
    transformation?: any;
    public_id?: string;
  }
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    let uploadData: string;
    
    if (typeof file === 'string') {
      uploadData = file;
    } else {
      // Convert Buffer to base64 with proper data URI format
      const base64Data = file.toString('base64');
      uploadData = `data:image/png;base64,${base64Data}`;
    }
    
    cloudinary.uploader.upload(
      uploadData,
      {
        folder: options?.folder || 'esports-platform',
        resource_type: options?.resource_type || 'image',
        transformation: options?.transformation,
        public_id: options?.public_id,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as CloudinaryUploadResult);
        }
      }
    );
  });
};

export const deleteImage = async (public_id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

export const generateImageUrl = (
  public_id: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    format?: string;
    quality?: number;
  }
): string => {
  return cloudinary.url(public_id, {
    width: options?.width,
    height: options?.height,
    crop: options?.crop || 'fill',
    format: options?.format || 'auto',
    quality: options?.quality || 'auto',
  });
};
