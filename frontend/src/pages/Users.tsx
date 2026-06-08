import { useEffect, useState } from 'react';
import { api } from '../api';
import { User, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Users as UsersIcon, Plus, Trash2, ShieldAlert, Loader2, X } from 'lucide-react';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.users.create({
        name: name || null,
        email,
        role,
        password: password || null,
      });
      setSuccess('User created successfully');
      setName('');
      setEmail('');
      setRole('USER');
      setPassword('');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string | null, userEmail: string) => {
    const displayName = userName || userEmail;
    if (!confirm(`Are you sure you want to permanently delete user "${displayName}"? All their created incidents and activities will also be deleted.`)) {
      return;
    }
    
    setError('');
    setSuccess('');
    try {
      await api.users.delete(userId);
      setSuccess(`User "${displayName}" deleted successfully`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setError('');
    setSuccess('');
    try {
      await api.users.update(userId, { role: newRole });
      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const getRoleBadgeColor = (userRole: Role) => {
    switch (userRole) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50';
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-16 w-16 text-red-600 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          Only system administrators are authorized to access the user management console.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-orange-600" />
            User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, manage and audit user accounts and roles ({users.length} active users)
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {showAddForm && (
        <Card className="border-orange-200 dark:border-orange-900/50 bg-card/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-lg font-bold">Add New User Account</CardTitle>
              <CardDescription>
                Create a user directly. Leaving password empty forces Google login registration.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Full Name (Optional)</Label>
                <Input
                  id="new-name"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-email">Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="e.g. john@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-role">System Role</Label>
                <Select
                  value={role}
                  onValueChange={setRole}
                  options={[
                    { value: 'USER', label: 'USER (Regular Responder)' },
                    { value: 'MANAGER', label: 'MANAGER (Team Lead)' },
                    { value: 'ADMIN', label: 'ADMIN (Administrator)' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Password (Optional)</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Leave blank to enforce Google Sign-in"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t mt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Fetching users catalog...</span>
        </div>
      ) : (
        <Card className="overflow-hidden border border-muted/50 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100/70 dark:bg-zinc-900/70 border-b border-muted/40 text-muted-foreground uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Authentication</th>
                  <th className="px-6 py-4 font-semibold">Joined Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/30">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const initials = u.name
                    ? u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : u.email.substring(0, 2).toUpperCase();
                    
                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center text-sm border border-orange-200 dark:border-orange-900/50">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {u.name || 'Anonymous User'}
                            {isSelf && (
                              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold dark:bg-zinc-800 dark:text-zinc-300">
                                YOU
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        {isSelf ? (
                          <Badge className={`${getRoleBadgeColor(u.role)} border shadow-sm`}>
                            {u.role}
                          </Badge>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(val) => handleRoleChange(u.id, val as Role)}
                            options={[
                              { value: 'USER', label: 'USER' },
                              { value: 'MANAGER', label: 'MANAGER' },
                              { value: 'ADMIN', label: 'ADMIN' },
                            ]}
                            className="w-32"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground font-medium">
                          {u.hasPassword ? 'Email & Password' : 'Google OAuth'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30"
                          onClick={() => handleDeleteUser(u.id, u.name, u.email)}
                          disabled={isSelf}
                          title={isSelf ? "You cannot delete yourself" : "Delete user profile"}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
