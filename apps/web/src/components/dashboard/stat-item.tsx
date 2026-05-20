import { Progress } from '@/components/ui/progress';
import { homeTypography } from '@/components/dashboard/home-styles';

export function StatItem({
  label,
  value,
  change,
  icon,
  progress,
  reserveProgressSlot = false,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  progress?: number;
  reserveProgressSlot?: boolean;
}) {
  const showProgress = typeof progress === 'number';

  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={homeTypography.body}>{label}</p>
        <p className={homeTypography.metric}>{value}</p>
        <p className="mt-1 text-sm text-emerald-600">{change}</p>
        {showProgress ? <Progress value={progress} className="mt-2 h-2 max-w-40" /> : null}
        {!showProgress && reserveProgressSlot ? (
          <Progress value={0} className="mt-2 h-2 max-w-40 opacity-0" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}
