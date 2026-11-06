import { uploadToCloudinary } from '../services/cloudinary.js';

/**
 * Handle direct file upload (photos, voice notes, PDFs) to Cloudinary
 */
export const uploadMedia = async (req, res) => {
  try {
    const { fileData, fileType = 'photo', fileName = 'upload' } = req.body;

    if (!fileData) {
      return res.status(400).json({ success: false, error: 'File data is required.' });
    }

    let resourceType = 'image';
    let folder = 'drivemate/photos';

    if (fileType === 'voice') {
      resourceType = 'video'; // Cloudinary handles audio/voice under 'video' resource_type
      folder = 'drivemate/audio';
    } else if (fileType === 'pdf') {
      resourceType = 'raw'; // PDF documents and raw files
      folder = 'drivemate/documents';
    }

    const uploadResult = await uploadToCloudinary(fileData, {
      folder,
      resource_type: resourceType,
      public_id: `${fileType}_${Date.now()}`,
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error || 'Cloudinary upload failed.',
      });
    }

    return res.status(200).json({
      success: true,
      mediaUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      fileType,
      fileName,
    });
  } catch (error) {
    console.error('[MediaController.uploadMedia] Exception:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Media upload failed.',
    });
  }
};

