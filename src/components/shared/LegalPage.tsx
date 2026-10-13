import type { ReactNode } from 'react';
import Link from 'next/link';

export const LEGAL_UPDATED = 'October 14, 2026';

export function contactEmail() {
  return process.env.CONTACT_EMAIL || 'support@localvibe.app';
}

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-5 py-8 lg:py-12">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">Last updated: {LEGAL_UPDATED}</p>
      <article className="prose-legal mt-8">{children}</article>
      <nav className="mt-12 pt-6 border-t border-gray-200 flex gap-5 text-sm text-gray-500">
        <Link href="/guidelines" className="hover:text-gray-800">Community Guidelines</Link>
        <Link href="/terms" className="hover:text-gray-800">Terms</Link>
        <Link href="/privacy" className="hover:text-gray-800">Privacy</Link>
      </nav>
    </div>
  );
}
