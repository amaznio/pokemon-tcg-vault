export { Input as CommandInput } from './input';
export const Command = ({ children }: { children: React.ReactNode }) => <div className="rounded-xl border border-slate-200 bg-white">{children}</div>;
export const CommandList = ({ children }: { children: React.ReactNode }) => <div className="max-h-60 overflow-auto p-2">{children}</div>;
export const CommandItem = ({ children }: { children: React.ReactNode }) => <div className="rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100">{children}</div>;
