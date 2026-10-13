/** Only allow same-site relative paths as post-login destinations. */
export function safeCallbackUrl(value: string | string[] | undefined, fallback = '/feed'): string {
  const url = Array.isArray(value) ? value[0] : value;
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/auth')) return fallback;
  return url;
}
