'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/client';
import { REPORT_REASONS, type ReportReason } from '@/types';

const LABELS: Record<ReportReason, string> = {
  spam: 'Spam or advertising',
  scam: 'Scam or fraud',
  harassment: 'Harassment or hate',
  misinformation: 'False or misleading information',
  inappropriate: 'Inappropriate or adult content',
  other: 'Something else',
};

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'listing' | 'user';
  targetId: string;
}

export function ReportDialog({ open, onClose, targetType, targetId }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await api('/api/reports', { body: { targetType, targetId, reason, details: details || undefined } });
      toast.success('Thanks. Our moderators will review this.');
      onClose();
      setReason(null);
      setDetails('');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Report ${targetType}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="emergency" onClick={submit} disabled={!reason} loading={loading}>Submit report</Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 mb-3">What&apos;s wrong? Reports are anonymous.</p>
      <div className="space-y-2">
        {REPORT_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-gray-50 has-[:checked]:border-community-500 has-[:checked]:bg-community-50">
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="text-community-600 focus:ring-community-500" />
            <span className="text-sm text-gray-800">{LABELS[r]}</span>
          </label>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Add details (optional)"
        className="input-field mt-3 resize-none"
      />
    </Modal>
  );
}
