import { NavLink } from 'react-router-dom';
import { CalendarCheck, Calendar, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { to: '/', label: 'Today', icon: CalendarCheck },
  { to: '/week', label: 'Week', icon: Calendar },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around backdrop-blur-xl bg-surface/70 border-t border-white/8 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-200 ${
              isActive
                ? 'text-primary'
                : 'text-muted hover:text-text'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
              <span>{label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-0.5 w-6 rounded-full bg-primary" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
