import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const UPLOAD_FOLDERS = {
  avatar: 'localvibe/avatars',
  post: 'localvibe/posts',
  listing: 'localvibe/listings',
} as const;

export type UploadKind = keyof typeof UPLOAD_FOLDERS;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

export function uploadImage(buffer: Buffer, kind: UploadKind, userId: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${UPLOAD_FOLDERS[kind]}/${userId}`,
        resource_type: 'image',
        // Strip EXIF (including GPS) and cap dimensions to keep storage within the free tier.
        transformation: [{ width: kind === 'avatar' ? 400 : 1600, height: kind === 'avatar' ? 400 : 1600, crop: kind === 'avatar' ? 'fill' : 'limit', gravity: kind === 'avatar' ? 'face' : undefined }],
        tags: [kind, userId],
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error('Upload failed'));
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/** Builds a delivery URL with automatic format/quality and an optional width. */
export function optimizedImageUrl(url: string, width?: number): string {
  if (!url.includes('/image/upload/')) return url;
  const transform = ['f_auto', 'q_auto', width ? `w_${width}` : null].filter(Boolean).join(',');
  return url.replace('/image/upload/', `/image/upload/${transform}/`);
}
