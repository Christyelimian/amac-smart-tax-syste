import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatTime } from '@/lib/constants';
import {
  Users,
  Building,
  MapPin,
  Bell,
  FileBarChart,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface Taxpayer {
  id: string;
  name: string;
  type: 'individual' | 'business' | 'property_owner';
  contactEmail: string;
  contactPhone: string;
  address: string;
  registrationNumber?: string;
  totalPaid: number;
  lastPayment: string;
  complianceStatus: 'compliant' | 'overdue' | 'non_compliant';
  outstandingAmount: number;
  zone: string;
  paymentHistory: number;
  complianceRate: number;
}

interface ComplianceStats {
  totalTaxpayers: number;
  compliantTaxpayers: number;
  overdueTaxpayers: number;
  nonCompliantTaxpayers: number;
  averageComplianceRate: number;
  totalOutstanding: number;
  remindersSent: number;
}

export default function AdminTaxpayers() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  const [complianceStats, setComplianceStats] = useState<ComplianceStats>({
    totalTaxpayers: 1250,
    compliantTaxpayers: 987,
    overdueTaxpayers: 156,
    nonCompliantTaxpayers: 107,
    averageComplianceRate: 79,
    totalOutstanding: 45200000,
    remindersSent: 234,
  });

  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([
    {
      id: '1',
      name: 'Grand Plaza Shopping Mall',
      type: 'business',
      contactEmail: 'admin@grandplaza.com',
      contactPhone: '+234-803-456-7890',
      address: 'Plot 1234, Central Business District, Abuja',
      registrationNumber: 'BN123456789',
      totalPaid: 45200000,
      lastPayment: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      complianceStatus: 'compliant',
      outstandingAmount: 0,
      zone: 'A',
      paymentHistory: 24,
      complianceRate: 100,
    },
    {
      id: '2',
      name: 'Transcorp Hilton',
      type: 'business',
      contactEmail: 'accounts@hilton.ng',
      contactPhone: '+234-802-123-4567',
      address: 'Plot 911, Wuse II, Abuja',
      registrationNumber: 'BN987654321',
      totalPaid: 18700000,
      lastPayment: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      complianceStatus: 'compliant',
      outstandingAmount: 0,
      zone: 'A',
      paymentHistory: 18,
      complianceRate: 95,
    },
    {
      id: '3',
      name: 'ABC Traders Limited',
      type: 'business',
      contactEmail: 'abc.traders@email.com',
      contactPhone: '+234-701-234-5678',
      address: 'Shop 45, Zone B Market, Abuja',
      registrationNumber: 'BN456789123',
      totalPaid: 1250000,
      lastPayment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      complianceStatus: 'overdue',
      outstandingAmount: 75000,
      zone: 'B',
      paymentHistory: 8,
      complianceRate: 75,
    },
    {
      id: '4',
      name: 'XYZ Properties Ltd',
      type: 'property_owner',
      contactEmail: 'xyz.properties@email.com',
      contactPhone: '+234-809-876-5432',
      address: 'Plot 567, Zone D Residential, Abuja',
      registrationNumber: 'PN789123456',
      totalPaid: 8500000,
      lastPayment: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      complianceStatus: 'non_compliant',
      outstandingAmount: 320000,
      zone: 'D',
      paymentHistory: 12,
      complianceRate: 45,
    },
    {
      id: '5',
      name: 'Mary Johnson',
      type: 'individual',
      contactEmail: 'mary.johnson@email.com',
      contactPhone: '+234-705-111-2222',
      address: 'Block 23, Zone C Estate, Abuja',
      totalPaid: 450000,
      lastPayment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      complianceStatus: 'overdue',
      outstandingAmount: 25000,
      zone: 'C',
      paymentHistory: 6,
      complianceRate: 60,
    },
  ]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchTaxpayers();
    }
  }, [user, isAdmin]);

  const fetchTaxpayers = async () => {
    try {
      // In a real implementation, this would fetch taxpayers from the database
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching taxpayers:', error);
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (taxpayerId: string) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update compliance stats
      setComplianceStats(prev => ({
        ...prev,
        remindersSent: prev.remindersSent + 1,
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Error sending reminder:', error);
      setIsLoading(false);
    }
  };

  const handleBulkReminders = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const overdueTaxpayers = taxpayers.filter(t => t.complianceStatus === 'overdue' || t.complianceStatus === 'non_compliant');
      setComplianceStats(prev => ({
        ...prev,
        remindersSent: prev.remindersSent + overdueTaxpayers.length,
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Error sending bulk reminders:', error);
      setIsLoading(false);
    }
  };

  const filteredTaxpayers = taxpayers.filter(taxpayer => {
    const matchesSearch = !searchTerm ||
      taxpayer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taxpayer.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taxpayer.contactPhone.includes(searchTerm) ||
      (taxpayer.registrationNumber && taxpayer.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || taxpayer.type === typeFilter;
    const matchesCompliance = complianceFilter === 'all' || taxpayer.complianceStatus === complianceFilter;
    const matchesZone = zoneFilter === 'all' || taxpayer.zone === zoneFilter;

    return matchesSearch && matchesType && matchesCompliance && matchesZone;
  });

  const getComplianceBadge = (status: string, rate: number) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Compliant</Badge>;
      case 'overdue':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ Overdue</Badge>;
      case 'non_compliant':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">❌ Non-Compliant</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'business':
        return <Building className="h-4 w-4 text-blue-600" />;
      case 'property_owner':
        return <MapPin className="h-4 w-4 text-green-600" />;
      case 'individual':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">👥 TAXPAYER MANAGEMENT</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Taxpayer
            </Button>
            <Button onClick={handleBulkReminders} disabled={isLoading}>
              <Bell className="h-4 w-4 mr-2" />
              Send Bulk Reminders
            </Button>
          </div>
        </div>

        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Total Taxpayers</h3>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-display font-bold">{complianceStats.totalTaxpayers}</p>
              <p className="text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Compliance Rate</h3>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-display font-bold text-green-600">{complianceStats.averageComplianceRate}%</p>
              <Progress value={complianceStats.averageComplianceRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Outstanding Amount</h3>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-3xl font-display font-bold text-red-600">
                {formatCurrency(complianceStats.totalOutstanding)}
              </p>
              <p className="text-sm text-muted-foreground">
                {complianceStats.overdueTaxpayers + complianceStats.nonCompliantTaxpayers} taxpayers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Reminders Sent</h3>
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-display font-bold text-blue-600">{complianceStats.remindersSent}</p>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>COMPLIANCE BREAKDOWN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="3"
                      strokeDasharray={`${(complianceStats.compliantTaxpayers / complianceStats.totalTaxpayers) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round((complianceStats.compliantTaxpayers / complianceStats.totalTaxpayers) * 100)}%
                    </span>
                  </div>
                </div>
                <h3 className="font-medium">Compliant</h3>
                <p className="text-sm text-muted-foreground">{complianceStats.compliantTaxpayers} taxpayers</p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="3"
                      strokeDasharray={`${(complianceStats.overdueTaxpayers / complianceStats.totalTaxpayers) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-yellow-600">
                      {Math.round((complianceStats.overdueTaxpayers / complianceStats.totalTaxpayers) * 100)}%
                    </span>
                  </div>
                </div>
                <h3 className="font-medium">Overdue</h3>
                <p className="text-sm text-muted-foreground">{complianceStats.overdueTaxpayers} taxpayers</p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeDasharray={`${(complianceStats.nonCompliantTaxpayers / complianceStats.totalTaxpayers) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-600">
                      {Math.round((complianceStats.nonCompliantTaxpayers / complianceStats.totalTaxpayers) * 100)}%
                    </span>
                  </div>
                </div>
                <h3 className="font-medium">Non-Compliant</h3>
                <p className="text-sm text-muted-foreground">{complianceStats.nonCompliantTaxpayers} taxpayers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, Email, Phone, Registration..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="property_owner">Property Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Compliance</label>
                <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Zone</label>
                <Select value={zoneFilter} onValueChange={setZoneFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    <SelectItem value="A">Zone A</SelectItem>
                    <SelectItem value="B">Zone B</SelectItem>
                    <SelectItem value="C">Zone C</SelectItem>
                    <SelectItem value="D">Zone D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxpayers Table */}
        <Card>
          <CardHeader>
            <CardTitle>TAXPAYER RECORDS ({filteredTaxpayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taxpayer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTaxpayers.map((taxpayer) => (
                  <TableRow key={taxpayer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getTypeIcon(taxpayer.type)}
                        <div>
                          <p className="font-medium">{taxpayer.name}</p>
                          <p className="text-sm text-muted-foreground">{taxpayer.contactEmail}</p>
                          {taxpayer.registrationNumber && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {taxpayer.registrationNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{taxpayer.type.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Zone {taxpayer.zone}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(taxpayer.totalPaid)}</TableCell>
                    <TableCell>
                      {taxpayer.outstandingAmount > 0 ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(taxpayer.outstandingAmount)}
                        </span>
                      ) : (
                        <span className="text-green-600">₦0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getComplianceBadge(taxpayer.complianceStatus, taxpayer.complianceRate)}
                        <span className="text-sm text-muted-foreground">
                          {taxpayer.complianceRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(taxpayer.lastPayment)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(taxpayer.complianceStatus === 'overdue' || taxpayer.complianceStatus === 'non_compliant') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Send Reminder"
                            onClick={() => handleSendReminder(taxpayer.id)}
                            disabled={isLoading}
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <FileBarChart className="h-4 w-4 mr-2" />
              Compliance Report
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Export List
            </Button>
          </div>
          <Button>
            <FileBarChart className="h-4 w-4 mr-2" />
            View Compliance Analytics
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
