export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** JSON fetch helper that throws ClientApiError with the server's message. */
export async function api<T>(url: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ClientApiError(response.status, (data as { error?: string }).error || `Request failed (${response.status})`);
  }
  return data as T;
}

export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

const MAX_DIMENSION = 1600;

/** Downscales large photos in the browser so uploads stay fast and under the 4 MB limit. */
async function compressImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || file.size < 500 * 1024) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  return blob && blob.size < file.size ? blob : file;
}

export async function uploadImage(file: File, kind: 'avatar' | 'post' | 'listing'): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  const blob = await compressImage(file);
  if (blob.size > 4 * 1024 * 1024) throw new Error('Image is too large. Please choose one under 4 MB.');

  const form = new FormData();
  form.append('file', blob, blob === file ? file.name : file.name.replace(/\.\w+$/, '.jpg'));
  form.append('kind', kind);
  const response = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Upload failed');
  return data.url as string;
}

export function imageUrl(url: string | undefined, width?: number): string | undefined {
  if (!url || !url.includes('/image/upload/')) return url;
  const transform = ['f_auto', 'q_auto', width ? `w_${width}` : null].filter(Boolean).join(',');
  return url.replace('/image/upload/', `/image/upload/${transform}/`);
}
