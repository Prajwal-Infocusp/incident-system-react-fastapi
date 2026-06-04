import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Incident, SEVERITY_COLORS, STATUS_COLORS } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { AlertTriangle, AlertCircle, Clock, AlertOctagon, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.incidents.list()
      .then((incidentsData) => {
        setIncidents(incidentsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Calculate statistics client-side to ensure accuracy and bypass backend database queries
  const totalCount = incidents.length;
  const openCount = incidents.filter(i => i.status === 'OPEN').length;
  const investigatingCount = incidents.filter(i => i.status === 'INVESTIGATING').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const assignedToMeCount = user ? incidents.filter(i => i.assignedToId === user.id && i.status !== 'RESOLVED').length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of all incidents</p>
        </div>
        <Link to="/incidents/new">
          <Button>Create Incident</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investigating</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investigatingCount}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card className={criticalCount > 0 ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertOctagon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Needs immediate attention</p>
          </CardContent>
        </Card>
        <Card className={assignedToMeCount > 0 ? 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned to You</CardTitle>
            <UserCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedToMeCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting your action</p>
          </CardContent>
        </Card>
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No incidents yet</p>
          <Link to="/incidents/new">
            <Button variant="ghost" className="mt-2">Create your first incident</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Recent Incidents</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.slice(0, 10).map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-mono text-xs">
                    {incident.id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/incidents/${incident.id}`}
                      className="font-medium hover:underline"
                    >
                      {incident.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={SEVERITY_COLORS[incident.severity]}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[incident.status]}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {incident.assignedTo?.name || incident.assignedTo?.email || 'Unassigned'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(incident.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}