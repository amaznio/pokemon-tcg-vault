'use client';
import { useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';

export function Sheet({ title, triggerLabel, children }: { title: string; triggerLabel: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>{triggerLabel}</Button>
      {open ? <div className="fixed inset-0 z-50 bg-black/20 p-4"><div className="ml-auto h-full w-full max-w-md"><Card className="h-full"><CardContent className="flex h-full flex-col gap-3"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3><Button variant="ghost" onClick={() => setOpen(false)}>Close</Button></div>{children}</CardContent></Card></div></div> : null}
    </>
  );
}
