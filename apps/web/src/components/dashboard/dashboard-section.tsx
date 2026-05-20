import { SectionHeading } from '@/components/shared/section-heading';
import { cn } from '@/lib/utils';
import { homeSpacing, homeTypography } from '@/components/dashboard/home-styles';

export function DashboardSection({
  title,
  icon,
  action,
  bottomAction,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  bottomAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {icon}
          <SectionHeading
            title={title}
            className="space-y-0"
            titleClassName={cn(homeTypography.sectionTitle)}
          />
        </div>
        {action}
      </div>
      <div className={cn('mt-6 flex flex-1 flex-col', homeSpacing.sectionStack)}>
        <div className="flex-1">{children}</div>
        {bottomAction}
      </div>
    </section>
  );
}
