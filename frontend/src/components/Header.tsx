import { useEffect, useState, useRef } from 'react';
import { Bell, BellRing, Sun, Moon } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api';
import { SEVERITY_COLORS } from '../types';

interface NotificationItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignedToId: string | null;
}

export function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      try {
        const data = await api.notifications.list();
        setNotifications(data.notifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistically remove from state
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // Call backend API to write to database
      await api.notifications.markRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const unreadCount = notifications.length;

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card text-card-foreground px-6">
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          ) : (
            <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          )}
        </Button>

        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative w-10 h-10"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {isOpen && (
            <div className="absolute right-0 mt-2 w-96 rounded-md border bg-card text-card-foreground shadow-md z-50 p-1">
              <div className="px-2 py-1.5 text-sm font-semibold border-b">
                Notifications
              </div>
              {loading ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No notifications
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => {
                    const isAssignedToMe = user && notification.assignedToId === user.id;
                    return (
                      <div key={notification.id} className="border-b last:border-0">
                        <div className={`flex flex-col w-full px-2 py-2 ${isAssignedToMe ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-accent'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm truncate">
                                  {notification.title}
                                </span>
                                <Badge className={`text-xs ml-2 ${(SEVERITY_COLORS as any)[notification.severity] || ''}`}>
                                  {notification.severity}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground capitalize">
                                {notification.status.toLowerCase()}
                              </span>
                              {isAssignedToMe && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Assigned to you</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-7 text-xs w-full justify-center"
                            onClick={(e) => {
                              e.preventDefault();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <BellRing className="h-3 w-3 mr-1" />
                            Mark as read
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {notifications.length > 5 && (
                    <div className="p-2 border-t text-center">
                      <Link to="/incidents" className="text-sm text-blue-600 dark:text-blue-400 hover:underline" onClick={() => setIsOpen(false)}>
                        View all incidents
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
