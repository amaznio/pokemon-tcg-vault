import { Button } from '@/components/ui/button';

export function PaginationBar({ page, onPrev, onNext }: { page: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onPrev}>Prev</Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button variant="outline" onClick={onNext}>Next</Button>
    </div>
  );
}
