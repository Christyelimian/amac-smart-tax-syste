import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import {
  ScrollText,
  Search,
  Filter,
  Eye,
  UserCheck,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Clock,
  Loader2,
  Download,
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface AuditLog {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  user_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  created_at: string | null;
  user_email?: string;
}

export default function AdminAuditLogs() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAuditLogs();
    }
  }, [user, isAdmin]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch user emails for logs
      const userIds = [...new Set(data?.map(log => log.user_id).filter(Boolean) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds as string[]);

      const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

      const enrichedLogs = (data || []).map(log => ({
        ...log,
        user_email: log.user_id ? profileMap.get(log.user_id) || 'Unknown' : 'System',
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
      case 'create':
        return <UserPlus className="h-4 w-4 text-success" />;
      case 'update':
      case 'edit':
        return <Edit className="h-4 w-4 text-info" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case 'login':
        return <UserCheck className="h-4 w-4 text-primary" />;
      case 'logout':
        return <UserMinus className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower === 'insert' || actionLower === 'create') {
      return <Badge className="bg-success text-success-foreground">CREATE</Badge>;
    }
    if (actionLower === 'update' || actionLower === 'edit') {
      return <Badge className="bg-info text-info-foreground">UPDATE</Badge>;
    }
    if (actionLower === 'delete') {
      return <Badge variant="destructive">DELETE</Badge>;
    }
    return <Badge variant="secondary">{action.toUpperCase()}</Badge>;
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.record_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase() === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ScrollText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Audit Logs</h1>
              <p className="text-muted-foreground">
                Track all system activities and admin actions
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold font-display">{logs.length}</p>
                </div>
                <ScrollText className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Creates</p>
                  <p className="text-2xl font-bold font-display text-success">
                    {logs.filter(l => l.action.toLowerCase() === 'insert' || l.action.toLowerCase() === 'create').length}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-success/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Updates</p>
                  <p className="text-2xl font-bold font-display text-info">
                    {logs.filter(l => l.action.toLowerCase() === 'update' || l.action.toLowerCase() === 'edit').length}
                  </p>
                </div>
                <Edit className="h-8 w-8 text-info/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deletes</p>
                  <p className="text-2xl font-bold font-display text-destructive">
                    {logs.filter(l => l.action.toLowerCase() === 'delete').length}
                  </p>
                </div>
                <Trash2 className="h-8 w-8 text-destructive/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by table, action, user, or record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-input bg-background text-sm"
          >
            <option value="all">All Actions</option>
            <option value="insert">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <ScrollText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No audit logs found</p>
                <p className="text-muted-foreground">
                  {searchTerm || actionFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No actions have been recorded yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatTime(log.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm">{log.user_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.table_name || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.record_id?.slice(0, 8) || 'N/A'}...
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Detail Modal */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Audit Log Details
              </DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p className="font-medium">{formatTime(selectedLog.created_at)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-medium">{selectedLog.user_email}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Action</p>
                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Table</p>
                    <p className="font-medium">{selectedLog.table_name || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 col-span-2">
                    <p className="text-sm text-muted-foreground">Record ID</p>
                    <p className="font-mono text-sm">{selectedLog.record_id || 'N/A'}</p>
                  </div>
                </div>

                {selectedLog.old_data && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Previous Data</p>
                    <pre className="p-4 rounded-lg bg-muted/50 overflow-x-auto text-xs">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_data && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">New Data</p>
                    <pre className="p-4 rounded-lg bg-muted/50 overflow-x-auto text-xs">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono text-sm">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
