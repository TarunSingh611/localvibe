'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage, imageUrl } from '@/lib/client';

interface ImagePickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max: number;
  kind: 'post' | 'listing';
  onUploadingChange?: (uploading: boolean) => void;
}

/** Uploads images as soon as they are picked and returns hosted URLs. */
export function ImagePicker({ value, onChange, max, kind, onUploadingChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, Math.max(0, max - value.length - pending));
    if (!selected.length) return;

    setPending((n) => n + selected.length);
    onUploadingChange?.(true);
    let urls = [...value];
    for (const file of selected) {
      try {
        const url = await uploadImage(file, kind);
        urls = [...urls, url];
        onChange(urls);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setPending((n) => n - 1);
      }
    }
    onUploadingChange?.(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {value.map((url) => (
        <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(url, 300)} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(value.filter((u) => u !== url))}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
            aria-label="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {Array.from({ length: pending }).map((_, i) => (
        <div key={`pending-${i}`} className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ))}
      {value.length + pending < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-community-400 hover:text-community-500 transition-colors"
        >
          <Camera className="w-6 h-6" />
          <span className="text-[11px] mt-1">
            {value.length + pending}/{max}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
