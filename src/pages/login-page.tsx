import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui/primitives';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('staff@clinic.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setLoading(true);
    try { await login(username, password); navigate((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'); } catch (err) { setError(err instanceof Error ? err.message : t('auth.unableToSignIn')); } finally { setLoading(false); }
  };

  return <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4"><div className="absolute right-4 top-4"><LanguageSwitcher /></div><div className="grid w-full max-w-4xl overflow-hidden rounded-xl border bg-white shadow-xl md:grid-cols-[1fr_1.05fr]"><div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex"><div><div className="mb-12 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15"><Stethoscope size={22} /></div><span className="font-semibold tracking-tight">BrightSmile</span></div><h1 className="max-w-xs text-3xl font-semibold leading-tight">{t('auth.tagline')}</h1><p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/75">{t('auth.intro')}</p></div><div className="flex items-center gap-2 text-xs text-primary-foreground/70"><ShieldCheck size={15} />{t('auth.secureAccess')}</div></div><div className="p-6 sm:p-10"><CardHeader className="px-0"><CardTitle className="text-2xl">{t('auth.welcome')}</CardTitle><CardDescription>{t('auth.signInDescription')}</CardDescription></CardHeader><CardContent className="px-0"><form className="space-y-5" onSubmit={submit}><div className="space-y-2"><Label htmlFor="username">{t('auth.username')}</Label><Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="password">{t('auth.password')}</Label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>{error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<Button className="w-full" type="submit" disabled={loading}>{loading ? t('auth.signingIn') : t('auth.signIn')}</Button><p className="text-center text-xs text-muted-foreground">{t('auth.demo')}</p></form></CardContent></div></div></div>;
}
