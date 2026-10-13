'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, buildQuery } from '@/lib/client';
import type { Paginated } from '@/types';

type Params = Record<string, string | number | boolean | null | undefined>;

/** Cursor-paginated list fetcher that resets whenever `params` change. */
export function usePaginated<T extends { id: string }>(endpoint: string | null, params: Params) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<{ key: string; message: string } | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const key = endpoint ? `${endpoint}${buildQuery(params)}` : null;
  const requestId = useRef(0);

  useEffect(() => {
    if (!key) return;
    const id = ++requestId.current;
    api<Paginated<T>>(key)
      .then((data) => {
        if (id !== requestId.current) return;
        setItems(data.items);
        setCursor(data.nextCursor);
        setLoadError(null);
        setMoreError(null);
        setLoadedKey(key);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setLoadError({ key, message: (err as Error).message });
        setLoadedKey(key);
      });
  }, [key]);

  const loadMore = useCallback(async () => {
    if (!endpoint || !cursor || loadingMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const data = await api<Paginated<T>>(`${endpoint}${buildQuery({ ...params, cursor })}`);
      if (id !== requestId.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...data.items.filter((item) => !seen.has(item.id))];
      });
      setCursor(data.nextCursor);
    } catch (err) {
      setMoreError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, cursor, loadingMore, key]);

  const prepend = useCallback((item: T) => setItems((prev) => [item, ...prev.filter((p) => p.id !== item.id)]), []);
  const update = useCallback((id: string, patch: Partial<T>) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item))), []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((item) => item.id !== id)), []);

  const loading = key === null || loadedKey !== key;
  const error = loadError?.key === key ? loadError.message : moreError;

  return { items, loading, loadingMore, error, hasMore: Boolean(cursor), loadMore, prepend, update, remove };
}
