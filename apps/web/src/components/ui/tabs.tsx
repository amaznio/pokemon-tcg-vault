'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Tabs({ tabs, value, onChange, children }: { tabs: { value: string; label: string }[]; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => <button key={tab.value} type="button" onClick={() => onChange(tab.value)} className={cn('rounded-xl px-3 py-2 text-sm', value === tab.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700')}>{tab.label}</button>)}
      </div>
      {children}
    </div>
  );
}

export const TabsContent = ({ value, activeValue, children }: { value: string; activeValue: string; children: React.ReactNode }) => value === activeValue ? <div>{children}</div> : null;
