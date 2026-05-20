import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="flex h-full flex-col rounded-xl border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5 py-0">
        <div className="flex-1">{children}</div>
        {bottomAction ? <div className="pt-4">{bottomAction}</div> : null}
      </CardContent>
    </Card>
  );
}
