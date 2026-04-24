import { put, del, list } from '@vercel/blob';

// Configuration Blob Storage pour le stockage d'images
export interface UploadResult {
  url: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

export const uploadImage = async (
  file: File,
  folder: string = 'uploads'
): Promise<UploadResult> => {
  try {
    const filename = `${folder}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      contentType: blob.contentType,
      size: file.size,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('Upload Image Error:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteImage = async (url: string): Promise<void> => {
  try {
    await del(url);
  } catch (error) {
    console.error('Delete Image Error:', error);
    throw new Error('Failed to delete image');
  }
};

export const listImages = async (folder: string = 'uploads'): Promise<string[]> => {
  try {
    const { blobs } = await list({ prefix: folder });
    return blobs.map(blob => blob.url);
  } catch (error) {
    console.error('List Images Error:', error);
    return [];
  }
};
