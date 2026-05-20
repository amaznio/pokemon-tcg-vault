import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { homeTypography } from '@/components/dashboard/home-styles';

export function StatItem({
  label,
  value,
  change,
  icon,
  progress,
  reserveProgressSlot = false,
  loading = false,
}: {
  label: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  progress?: number;
  reserveProgressSlot?: boolean;
  loading?: boolean;
}) {
  const showProgress = typeof progress === 'number';

  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={homeTypography.body}>{label}</p>
        {loading ? <Skeleton className="mt-1 h-10 w-24 rounded-md" /> : <p className={homeTypography.metric}>{value}</p>}
        {change ? <p className="mt-1 text-sm text-emerald-600">{change}</p> : null}
        {showProgress ? <Progress value={loading ? 0 : progress} className="mt-2 h-2 max-w-40" /> : null}
        {!showProgress && reserveProgressSlot ? (
          <Progress value={0} className="mt-2 h-2 max-w-40 opacity-0" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}
