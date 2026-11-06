import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djl2x1rhf',
  api_key: process.env.CLOUDINARY_API_KEY || '768448229211299',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'xWD75BYkKuScQVd7SsEPvdVCduU',
  secure: true,
});

/**
 * Upload an image, voice recording, or PDF/document to Cloudinary
 * @param {string} fileSource - base64 string (data:image/...) or remote URL or local path
 * @param {object} options - folder, resource_type ('image' | 'video' | 'raw' | 'auto')
 */
export const uploadToCloudinary = async (fileSource, options = {}) => {
  try {
    const resourceType = options.resource_type || 'auto';
    const folder = options.folder || 'drivemate';

    const uploadOptions = {
      folder,
      resource_type: resourceType,
      ...options,
    };

    const result = await cloudinary.uploader.upload(fileSource, uploadOptions);
    return {
      success: true,
      url: result.secure_url || result.url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('❌ [Cloudinary Upload Error]:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to upload media to Cloudinary.',
    };
  }
};

export default {
  cloudinary,
  uploadToCloudinary,
};

