export const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className + ' overflow-auto'}>{children}</div>;
