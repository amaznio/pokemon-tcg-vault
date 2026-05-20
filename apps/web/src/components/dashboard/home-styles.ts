export const homeTypography = {
  heroEyebrow: 'text-sm font-medium text-primary',
  heroTitle: 'text-4xl font-semibold tracking-tight leading-tight md:text-5xl',
  heroSubtitle: 'text-base text-muted-foreground leading-relaxed md:text-lg',
  sectionTitle: 'text-xl font-semibold tracking-tight',
  tileTitle: 'text-base font-semibold text-foreground',
  body: 'text-sm text-muted-foreground leading-relaxed',
  meta: 'text-xs text-muted-foreground',
  metric: 'text-3xl font-semibold tracking-tight leading-tight text-foreground',
} as const;

export const homeSpacing = {
  pageStack: 'space-y-8',
  sectionStack: 'gap-6',
  group: 'gap-4',
  tightGroup: 'gap-2',
  surfacePadding: 'p-6',
  tilePadding: 'p-4',
} as const;
