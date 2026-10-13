import { route, ok, badRequest, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { isCloudinaryConfigured, uploadImage, UPLOAD_FOLDERS, type UploadKind } from '@/lib/cloudinary';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit({ key: `upload:${user._id}`, limit: 40, windowSeconds: 3600 });
  if (!isCloudinaryConfigured()) throw new ApiError(503, 'Image uploads are not configured yet');

  const form = await request.formData();
  const file = form.get('file');
  const kind = form.get('kind');

  if (!(file instanceof File)) throw badRequest('No file provided');
  if (typeof kind !== 'string' || !(kind in UPLOAD_FOLDERS)) throw badRequest('Invalid upload kind');
  if (!ALLOWED_TYPES.has(file.type)) throw badRequest('Only JPG, PNG, WebP or GIF images are allowed');
  if (file.size > MAX_BYTES) throw badRequest('Images must be smaller than 4 MB');

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImage(buffer, kind as UploadKind, user._id.toString());

  return ok({ url: result.secure_url, width: result.width, height: result.height }, { status: 201 });
});
