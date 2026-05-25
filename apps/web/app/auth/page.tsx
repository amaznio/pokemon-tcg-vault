'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AuthPage() {
  const router = useRouter();
  const auth = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const submit = async () => {
    if (mode === 'register') {
      await auth.register.mutateAsync({ email, password, ...(name.trim() ? { name } : {}) });
    } else {
      await auth.login.mutateAsync({ email, password });
    }
    router.push('/cards');
  };

  const error = auth.login.error ?? auth.register.error;

  return (
    <section className="mx-auto flex min-h-[520px] max-w-md flex-col justify-center gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Collections and Firecrawl price refreshes are saved to your account.</p>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {mode === 'register' ? (
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" autoComplete="name" />
        ) : null}
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" autoComplete="email" />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
        <Button type="submit" className="h-10 rounded-xl" disabled={auth.login.isPending || auth.register.isPending}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
      <Button variant="ghost" className="rounded-xl" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Create an account' : 'I already have an account'}
      </Button>
    </section>
  );
}
