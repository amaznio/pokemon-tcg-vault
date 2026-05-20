import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export function SectionActionLink({
  href,
  label,
  fullWidth = false,
  plain = false,
}: {
  href: Route;
  label: string;
  fullWidth?: boolean;
  plain?: boolean;
}) {
  if (plain) {
    return (
      <Link href={href} className="text-sm font-medium text-primary hover:underline">
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: 'secondary', size: 'lg' }),
        'h-10 rounded-xl text-primary hover:text-primary',
        fullWidth && 'w-full justify-center',
      )}
    >
      {label}
      <ArrowRight className="size-4" />
    </Link>
  );
}
