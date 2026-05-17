'use client';
import { useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';

export function Dialog({ title, triggerLabel, children }: { title: string; triggerLabel: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>{triggerLabel}</Button>
      {open ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4"><Card className="w-full max-w-lg"><CardContent className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3><Button variant="ghost" onClick={() => setOpen(false)}>Close</Button></div>{children}</CardContent></Card></div> : null}
    </>
  );
}
