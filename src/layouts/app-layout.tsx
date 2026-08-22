import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, Stethoscope, Users, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';

const navigation = [
  { key: 'dashboard', path: '/', icon: LayoutDashboard },
  { key: 'patients', path: '/patients', icon: Users },
  { key: 'calendar', path: '/calendar', icon: CalendarDays },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white transition-transform lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-20 items-center gap-3 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Stethoscope size={20} /></div>
          <div><p className="font-semibold tracking-tight">BrightSmile</p><p className="text-xs text-muted-foreground">{t('navigation.clinicWorkspace')}</p></div>
          <Button className="ml-auto lg:hidden" variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label={t('navigation.close')}><X size={18} /></Button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('navigation.workspace')}</p>
          {navigation.map((item) => { const Icon = item.icon; return <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}><Icon size={18} strokeWidth={1.8} />{t(`navigation.${item.key}`)}</NavLink>; })}
          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('navigation.quickAccess')}</p>
          <NavLink to="/patients" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"><ClipboardList size={18} strokeWidth={1.8} />{t('navigation.patientRecords')}</NavLink>
        </nav>
        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3 rounded-md bg-slate-50 p-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{user?.full_name.charAt(0)}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{user?.full_name}</p><p className="capitalize text-xs text-muted-foreground">{user?.role}</p></div></div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}><LogOut size={16} />{t('navigation.signOut')}</Button>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b bg-white/90 px-4 backdrop-blur lg:px-8">
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label={t('navigation.open')}><Menu size={20} /></Button>
          <div className="hidden lg:block"><p className="text-sm font-medium text-slate-500">Wednesday, August 20, 2026</p></div>
          <div className="ml-auto flex items-center gap-3"><LanguageSwitcher /><button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={t('navigation.notifications')}><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" /></button><div className="h-7 w-px bg-border" /><span className="text-sm font-medium text-slate-700">{user?.full_name}</span></div>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
