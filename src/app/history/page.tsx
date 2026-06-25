'use client';

import { Suspense } from 'react';
import { HistoryView } from '@/components/history-view';

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center text-slate-500">Loading...</div>}>
      <HistoryView />
    </Suspense>
  );
}
