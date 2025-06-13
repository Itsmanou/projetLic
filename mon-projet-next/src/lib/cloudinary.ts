import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper function to upload image to Cloudinary
export async function uploadImageToCloudinary(file: File): Promise<string> {
  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    console.log('Uploading image to Cloudinary...');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'pharmashop/products', // Organize your images in folders
      transformation: [
        { width: 800, height: 600, crop: 'limit' }, // Resize images
        { quality: 'auto' }, // Auto optimize quality
        { format: 'auto' } // Auto choose best format (WebP, etc.)
      ],
      resource_type: 'image'
    });

    console.log('Image uploaded successfully to Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

// Helper function to delete image from Cloudinary
export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      console.log('Not a Cloudinary URL, skipping deletion');
      return;
    }

    // Extract public_id from the URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return;
    
    // Get everything after upload/v{version}/
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = pathAfterUpload.split('.')[0]; // Remove file extension
    
    console.log('Deleting image from Cloudinary:', publicId);
    await cloudinary.uploader.destroy(publicId);
    console.log('Image deleted successfully from Cloudinary');
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw error as this is cleanup operation
  }
}

// Helper function to extract public_id from Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    return pathAfterUpload.split('.')[0]; // Remove file extension
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}