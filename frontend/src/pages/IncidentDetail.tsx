import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Incident, UserSummary, SEVERITY_COLORS, STATUS_COLORS, IncidentStatus, Severity } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Textarea } from '../components/ui/Textarea';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { ArrowLeft } from 'lucide-react';

function formatDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTIVITY_ICONS: Record<string, string> = {
  CREATED: '📝',
  ASSIGNED: '👤',
  STATUS_CHANGED: '🔄',
  COMMENTED: '💬',
  UPDATED: '✏️',
};

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<IncidentStatus>('OPEN');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState<string>('unassigned');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.incidents.get(id),
      api.users.list(),
    ])
      .then(([incidentData, usersData]) => {
        setIncident(incidentData);
        setStatus(incidentData.status);
        setSeverity(incidentData.severity);
        setAssignedToId(incidentData.assignedToId || 'unassigned');
        setUsers(usersData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpdate() {
    if (!id) return;
    setUpdating(true);
    try {
      await api.incidents.update(id, {
        status,
        severity,
        assignedToId: assignedToId === 'unassigned' ? null : assignedToId,
      });

      if (comment) {
        await api.incidents.addActivity(id, {
          action: 'COMMENTED',
          message: comment,
        });
      }

      const updated = await api.incidents.get(id);
      setIncident(updated);
      setComment('');
    } catch (error) {
      console.error('Failed to update incident:', error);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!incident) {
    return <div>Incident not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/incidents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{incident.title}</h1>
          <p className="text-muted-foreground font-mono text-sm">
            ID: {incident.id.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{incident.description || 'No description provided'}</p>
              </div>
              <div className="pt-4 border-t">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Created By</Label>
                    <p className="mt-1">{incident.createdBy?.name || incident.createdBy?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created At</Label>
                    <p className="mt-1">{formatDate(incident.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Incident</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as IncidentStatus)}
                    options={[
                      { value: 'OPEN', label: 'Open' },
                      { value: 'INVESTIGATING', label: 'Investigating' },
                      { value: 'RESOLVED', label: 'Resolved' },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={severity}
                    onValueChange={(v) => setSeverity(v as Severity)}
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' },
                      { value: 'CRITICAL', label: 'Critical' },
                    ]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={assignedToId}
                  onValueChange={setAssignedToId}
                  options={[
                    { value: 'unassigned', label: 'Unassigned' },
                    ...users.map(u => ({ value: u.id, label: u.name || u.email })),
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>Add Comment</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a note about this update..."
                  rows={3}
                />
              </div>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? 'Updating...' : 'Update Incident'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`text-base px-3 py-1 ${STATUS_COLORS[incident.status]}`}>
                {incident.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`text-base px-3 py-1 ${SEVERITY_COLORS[incident.severity]}`}>
                {incident.severity}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">
                {incident.assignedTo?.name || incident.assignedTo?.email || 'Unassigned'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Created At</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{formatDate(incident.createdAt)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {incident.activities && incident.activities.length > 0 ? (
            <div className="space-y-4">
              {incident.activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <span className="text-xl">{ACTIVITY_ICONS[activity.action] || '📝'}</span>
                  <div className="space-y-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.createdBy?.name || activity.createdBy?.email} • {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No activity yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}