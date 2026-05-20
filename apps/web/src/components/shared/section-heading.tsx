import { cn } from '@/lib/utils';

export function SectionHeading({
  title,
  subtitle,
  className,
  titleClassName,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <h2 className={cn('text-xl font-semibold tracking-tight', titleClassName)}>{title}</h2>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
