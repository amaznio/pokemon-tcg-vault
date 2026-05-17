'use client';
import { useState } from 'react';
import { Button } from './button';

export function DropdownMenu({ label, items }: { label: string; items: { label: string; onClick?: () => void }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label={label}>⋯</Button>
      {open ? <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">{items.map((item) => <button key={item.label} className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100" onClick={item.onClick}>{item.label}</button>)}</div> : null}
    </div>
  );
}
