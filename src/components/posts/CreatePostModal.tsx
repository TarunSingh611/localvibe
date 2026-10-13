'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImagePicker } from '@/components/shared/ImagePicker';
import { POST_TYPE_META, SEVERITY_META, EMERGENCY_CATEGORY_LABELS } from './postMeta';
import { useLocationStore, useUIStore } from '@/store/useStore';
import { api } from '@/lib/client';
import { cn } from '@/lib/utils';
import { POST_TYPES, SEVERITIES, EMERGENCY_CATEGORIES, type EmergencyCategory, type PostDTO, type PostType, type Severity } from '@/types';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (post: PostDTO) => void;
  initialType?: PostType;
}

function defaultEventTime() {
  const date = new Date(Date.now() + 24 * 3600 * 1000);
  date.setMinutes(0, 0, 0);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CreatePostModal({ open, onClose, onCreated, initialType = 'community' }: CreatePostModalProps) {
  const location = useLocationStore((s) => s.location);
  const openPicker = useUIStore((s) => s.openLocationPicker);
  const [type, setType] = useState<PostType>(initialType);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [startsAt, setStartsAt] = useState(defaultEventTime);
  const [venue, setVenue] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [category, setCategory] = useState<EmergencyCategory>('other');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setType(initialType);
  }, [open, initialType]);

  const reset = () => {
    setText('');
    setImages([]);
    setTags([]);
    setTagInput('');
    setVenue('');
    setStartsAt(defaultEventTime());
    setSeverity('medium');
    setCategory('other');
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-]/g, '').slice(0, 24);
    if (tag && !tags.includes(tag) && tags.length < 5) setTags([...tags, tag]);
    setTagInput('');
  };

  const submit = async () => {
    if (!location) {
      openPicker();
      return;
    }
    setSubmitting(true);
    try {
      const post = await api<PostDTO>('/api/posts', {
        body: {
          type,
          text,
          images,
          tags,
          location,
          event: type === 'event' ? { startsAt: new Date(startsAt).toISOString(), venue: venue || undefined } : undefined,
          emergency: type === 'emergency' ? { severity, category } : undefined,
        },
      });
      toast.success(type === 'emergency' ? 'Alert published to people nearby' : 'Posted!');
      onCreated(post);
      reset();
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a post"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={type === 'emergency' ? 'emergency' : 'primary'}
            onClick={submit}
            loading={submitting}
            disabled={!text.trim() || uploading}
          >
            {type === 'emergency' ? 'Publish alert' : 'Post'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
          {POST_TYPES.map((t) => {
            const Icon = POST_TYPE_META[t].icon;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn('chip', type === t ? (t === 'emergency' ? 'border-emergency-500 bg-emergency-500 text-white' : 'chip-active') : 'chip-idle')}
              >
                <Icon className="w-4 h-4" />
                {POST_TYPE_META[t].label}
              </button>
            );
          })}
        </div>

        {type === 'emergency' && (
          <div className="rounded-xl bg-emergency-50 border border-emergency-200 p-3 text-sm text-emergency-800 flex gap-2">
            <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong>If anyone is in danger, call your local emergency number first.</strong> LocalVibe alerts inform neighbors but do not
              contact emergency services. High and critical alerts notify people within 10 km. False alerts lead to a ban.
            </p>
          </div>
        )}

        <div>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder={
              type === 'question' ? 'Ask your neighbors… e.g. "Any good plumber nearby?"'
                : type === 'lostfound' ? 'Describe what was lost or found, and where.'
                : type === 'event' ? 'What is happening? Who is it for?'
                : type === 'emergency' ? 'What is happening and where exactly? What should people do?'
                : "What's happening in your neighborhood?"
            }
            className="input-field text-base resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{text.length}/2000</p>
        </div>

        {type === 'event' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Starts</label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Venue (optional)</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={120} placeholder="Community hall, park…" className="input-field" />
            </div>
          </div>
        )}

        {type === 'emergency' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as EmergencyCategory)} className="input-field">
                {EMERGENCY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{EMERGENCY_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className="input-field">
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{SEVERITY_META[s].label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="label">Photos</label>
          <ImagePicker value={images} onChange={setImages} max={4} kind="post" onUploadingChange={setUploading} />
        </div>

        <div>
          <label className="label">Tags ({tags.length}/5)</label>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-community-50 text-community-700 px-2.5 py-1 text-sm">
                #{tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="Add tag"
                className="flex-1 min-w-[8rem] text-sm border-0 border-b border-gray-200 focus:ring-0 focus:border-community-500 px-1 py-1"
              />
            )}
          </div>
        </div>

        <button type="button" onClick={openPicker} className="flex items-center gap-2 text-sm text-gray-600 hover:text-community-700">
          <MapPin className="w-4 h-4 text-community-500" />
          {location ? (
            <>Posting to <strong className="font-semibold">{location.place.label}</strong> · change</>
          ) : (
            <strong className="text-emergency-600">Set your location to post</strong>
          )}
        </button>
      </div>
    </Modal>
  );
}
