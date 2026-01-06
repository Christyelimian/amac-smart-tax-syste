import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/constants';
import {
  AlertTriangle,
  Search,
  FileWarning,
  Send,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Loader2,
  UserX,
  Flag,
  Download,
} from 'lucide-react';

interface Defaulter {
  user_id: string;
  payer_name: string;
  payer_email: string | null;
  payer_phone: string | null;
  total_overdue: number;
  properties_count: number;
  last_payment_date: string | null;
  zone: string;
}

interface PropertyDefaulter {
  id: string;
  name: string;
  revenue_type: string;
  amount_due: number;
  due_date: string;
  zone: string;
  user_id: string;
  payer_name?: string;
  payer_email?: string;
  payer_phone?: string;
}

export default function AdminEnforcement() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [defaulters, setDefaulters] = useState<PropertyDefaulter[]>([]);
  const [selectedDefaulter, setSelectedDefaulter] = useState<PropertyDefaulter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchDefaulters();
    }
  }, [user, isAdmin]);

  const fetchDefaulters = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch properties with overdue payments
      const { data: overdueProperties, error } = await supabase
        .from('user_properties')
        .select(`
          id,
          name,
          revenue_type,
          amount_due,
          due_date,
          zone,
          user_id
        `)
        .lt('due_date', today)
        .gt('amount_due', 0)
        .order('amount_due', { ascending: false });

      if (error) throw error;

      // Fetch profile data for these users
      const userIds = [...new Set(overdueProperties?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedDefaulters = (overdueProperties || []).map(prop => ({
        ...prop,
        payer_name: profileMap.get(prop.user_id)?.full_name || 'Unknown',
        payer_email: profileMap.get(prop.user_id)?.email || null,
        payer_phone: profileMap.get(prop.user_id)?.phone || null,
      }));

      setDefaulters(enrichedDefaulters);
    } catch (error) {
      console.error('Error fetching defaulters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDefaulters = defaulters.filter((d) => {
    const matchesSearch =
      d.payer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.revenue_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = zoneFilter === 'all' || d.zone === zoneFilter;
    return matchesSearch && matchesZone;
  });

  const totalOverdue = filteredDefaulters.reduce((sum, d) => sum + Number(d.amount_due), 0);
  const uniqueDefaulters = new Set(filteredDefaulters.map(d => d.user_id)).size;

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSeverityBadge = (daysOverdue: number) => {
    if (daysOverdue > 90) {
      return <Badge variant="destructive" className="bg-destructive">Critical (90+ days)</Badge>;
    } else if (daysOverdue > 60) {
      return <Badge className="bg-orange-500 text-white">High (60+ days)</Badge>;
    } else if (daysOverdue > 30) {
      return <Badge className="bg-warning text-warning-foreground">Medium (30+ days)</Badge>;
    }
    return <Badge variant="secondary">Low (&lt;30 days)</Badge>;
  };

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
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Enforcement</h1>
              <p className="text-muted-foreground">
                Track defaulters and manage field officer operations
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Overdue</p>
                  <p className="text-2xl font-bold font-display text-destructive">
                    {formatCurrency(totalOverdue)}
                  </p>
                </div>
                <FileWarning className="h-10 w-10 text-destructive/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Defaulters</p>
                  <p className="text-2xl font-bold font-display">{uniqueDefaulters}</p>
                </div>
                <UserX className="h-10 w-10 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Cases</p>
                  <p className="text-2xl font-bold font-display text-destructive">
                    {filteredDefaulters.filter(d => getDaysOverdue(d.due_date) > 90).length}
                  </p>
                </div>
                <Flag className="h-10 w-10 text-destructive/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Properties Affected</p>
                  <p className="text-2xl font-bold font-display">{filteredDefaulters.length}</p>
                </div>
                <MapPin className="h-10 w-10 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, property, or revenue type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-input bg-background text-sm"
          >
            <option value="all">All Zones</option>
            <option value="a">Zone A</option>
            <option value="b">Zone B</option>
            <option value="c">Zone C</option>
            <option value="d">Zone D</option>
          </select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export List
          </Button>
          <Button className="gap-2 bg-destructive hover:bg-destructive/90">
            <Send className="h-4 w-4" />
            Send Bulk Reminders
          </Button>
        </div>

        {/* Defaulters Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Defaulters List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDefaulters.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No defaulters found</p>
                <p className="text-muted-foreground">
                  {searchTerm || zoneFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'All taxpayers are up to date!'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Taxpayer</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Amount Due</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDefaulters.map((defaulter) => {
                      const daysOverdue = getDaysOverdue(defaulter.due_date);
                      return (
                        <TableRow
                          key={defaulter.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedDefaulter(defaulter)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                                <UserX className="h-4 w-4 text-destructive" />
                              </div>
                              <div>
                                <p className="font-medium">{defaulter.payer_name}</p>
                                <p className="text-xs text-muted-foreground">{defaulter.payer_email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{defaulter.name}</p>
                              <p className="text-xs text-muted-foreground">{defaulter.revenue_type}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Zone {defaulter.zone.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-destructive">
                            {formatCurrency(defaulter.amount_due)}
                          </TableCell>
                          <TableCell>{daysOverdue} days</TableCell>
                          <TableCell>{getSeverityBadge(daysOverdue)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" title="Call">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Email">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Schedule Visit">
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Defaulter Detail Modal */}
        <Dialog open={!!selectedDefaulter} onOpenChange={() => setSelectedDefaulter(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Defaulter Details</DialogTitle>
              <DialogDescription>
                View details and take enforcement actions
              </DialogDescription>
            </DialogHeader>
            {selectedDefaulter && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <UserX className="h-8 w-8 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedDefaulter.payer_name}</h3>
                    <p className="text-muted-foreground">Zone {selectedDefaulter.zone.toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="font-medium">{selectedDefaulter.name}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Revenue Type</p>
                    <p className="font-medium">{selectedDefaulter.revenue_type}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/10">
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="font-medium text-destructive">
                      {formatCurrency(selectedDefaulter.amount_due)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {new Date(selectedDefaulter.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Contact Information</p>
                  <div className="space-y-2">
                    {selectedDefaulter.payer_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {selectedDefaulter.payer_email}
                      </div>
                    )}
                    {selectedDefaulter.payer_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {selectedDefaulter.payer_phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 gap-2">
                    <Send className="h-4 w-4" />
                    Send Reminder
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <FileWarning className="h-4 w-4" />
                    Generate Demand Notice
                  </Button>
                </div>
                <Button variant="destructive" className="w-full gap-2">
                  <Flag className="h-4 w-4" />
                  Flag for Field Enforcement
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
