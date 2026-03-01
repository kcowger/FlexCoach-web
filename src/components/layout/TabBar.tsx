import { NavLink } from 'react-router-dom';
import { CalendarCheck, Calendar, MessageCircle, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { to: '/', label: 'Today', icon: CalendarCheck },
  { to: '/week', label: 'Week', icon: Calendar },
  { to: '/coach', label: 'Coach', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-surface border-t border-surface-light pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-muted'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
