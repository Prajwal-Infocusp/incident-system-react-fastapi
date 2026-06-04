import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Incident, UserSummary, SEVERITY_COLORS, STATUS_COLORS } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'severity' | 'createdAt' | 'createdBy' | 'assignedTo';
type SortDirection = 'asc' | 'desc';

const severityOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Incidents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    Promise.all([
      api.incidents.list({
        status: searchParams.get('status') || undefined,
        severity: searchParams.get('severity') || undefined,
        assignee: searchParams.get('assignee') || undefined,
      }),
      api.users.list(),
    ])
      .then(([incidentsData, usersData]) => {
        setIncidents(incidentsData);
        setUsers(usersData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedIncidents = useMemo(() => {
    if (!sortField) return incidents;

    return [...incidents].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'severity':
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'createdBy':
          const aName = a.createdBy?.name || a.createdBy?.email || '';
          const bName = b.createdBy?.name || b.createdBy?.email || '';
          comparison = aName.localeCompare(bName);
          break;
        case 'assignedTo':
          const aAssign = a.assignedTo?.name || a.assignedTo?.email || '';
          const bAssign = b.assignedTo?.name || b.assignedTo?.email || '';
          comparison = aAssign.localeCompare(bAssign);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [incidents, sortField, sortDirection]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Manage and track all incidents</p>
        </div>
        <Link to="/incidents/new">
          <Button>Create Incident</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select
            value={searchParams.get('status') || 'all'}
            onValueChange={(v) => handleFilterChange('status', v)}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'OPEN', label: 'Open' },
              { value: 'INVESTIGATING', label: 'Investigating' },
              { value: 'RESOLVED', label: 'Resolved' },
            ]}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Severity</Label>
          <Select
            value={searchParams.get('severity') || 'all'}
            onValueChange={(v) => handleFilterChange('severity', v)}
            options={[
              { value: 'all', label: 'All severities' },
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Assignee</Label>
          <Select
            value={searchParams.get('assignee') || 'all'}
            onValueChange={(v) => handleFilterChange('assignee', v)}
            options={[
              { value: 'all', label: 'All assignees' },
              ...users.map(u => ({ value: u.id, label: u.name || u.email })),
            ]}
            className="w-[160px]"
          />
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No incidents found</p>
          <Link to="/incidents/new">
            <Button variant="ghost" className="mt-2">Create a new incident</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('severity')}
                >
                  <div className="flex items-center gap-1">
                    Severity
                    {sortField === 'severity' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('assignedTo')}
                >
                  <div className="flex items-center gap-1">
                    Assignee
                    {sortField === 'assignedTo' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('createdBy')}
                >
                  <div className="flex items-center gap-1">
                    Created By
                    {sortField === 'createdBy' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Created At
                    {sortField === 'createdAt' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-mono text-xs">
                    {incident.id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Link to={`/incidents/${incident.id}`} className="font-medium hover:underline">
                      {incident.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={SEVERITY_COLORS[incident.severity]}>{incident.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[incident.status]}>{incident.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {incident.assignedTo?.name || incident.assignedTo?.email || '-'}
                  </TableCell>
                  <TableCell>
                    {incident.createdBy?.name || incident.createdBy?.email || '-'}
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