import { Progress } from '@/components/ui/progress';

export function StatItem({
  label,
  value,
  change,
  icon,
  progress,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  progress?: number;
}) {
  return (
    <div className="flex items-start gap-3 px-2 py-1">
      <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold leading-tight text-foreground">{value}</p>
        <p className="mt-1 text-sm text-emerald-600">{change}</p>
        {typeof progress === 'number' ? <Progress value={progress} className="mt-2 max-w-40" /> : null}
      </div>
    </div>
  );
}
