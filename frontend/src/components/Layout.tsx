import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { Header } from './Header';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="flex flex-col w-64 border-r bg-card text-card-foreground h-screen">
        <div className="flex h-16 items-center px-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <span className="font-bold text-base text-orange-600 truncate">Infocusp IncidentHub</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          {user && (
            <div className="mb-3 px-3">
              <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}