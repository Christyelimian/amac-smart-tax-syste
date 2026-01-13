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
  Truck,
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  Smartphone,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Map,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Activity,
  Wallet,
} from 'lucide-react';

interface Collector {
  id: string;
  name: string;
  employeeId: string;
  contactPhone: string;
  contactEmail: string;
  assignedZone: string;
  status: 'active' | 'inactive' | 'on_leave';
  totalCollections: number;
  todayCollections: number;
  monthlyTarget: number;
  monthlyProgress: number;
  performanceRating: number;
  lastActive: string;
  paymentMethods: string[];
  routeOptimized: boolean;
  appVersion: string;
  deviceType: string;
}

interface ZoneAssignment {
  zone: string;
  collectorCount: number;
  totalTaxpayers: number;
  coverageRate: number;
  averagePerformance: number;
}

interface CollectionStats {
  totalCollectors: number;
  activeCollectors: number;
  totalCollectionsToday: number;
  averagePerformance: number;
  zonesCovered: number;
  appUsers: number;
}

export default function AdminCollectors() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    totalCollectors: 48,
    activeCollectors: 42,
    totalCollectionsToday: 1275000,
    averagePerformance: 87,
    zonesCovered: 4,
    appUsers: 38,
  });

  const [zoneAssignments, setZoneAssignments] = useState<ZoneAssignment[]>([
    { zone: 'A', collectorCount: 15, totalTaxpayers: 450, coverageRate: 95, averagePerformance: 92 },
    { zone: 'B', collectorCount: 12, totalTaxpayers: 380, coverageRate: 88, averagePerformance: 85 },
    { zone: 'C', collectorCount: 10, totalTaxpayers: 320, coverageRate: 82, averagePerformance: 78 },
    { zone: 'D', collectorCount: 11, totalTaxpayers: 280, coverageRate: 75, averagePerformance: 72 },
  ]);

  const [collectors, setCollectors] = useState<Collector[]>([
    {
      id: '1',
      name: 'John Adebayo',
      employeeId: 'COL-001',
      contactPhone: '+234-803-123-4567',
      contactEmail: 'john.adebayo@amac.ng',
      assignedZone: 'A',
      status: 'active',
      totalCollections: 45200000,
      todayCollections: 185000,
      monthlyTarget: 4500000,
      monthlyProgress: 92,
      performanceRating: 95,
      lastActive: new Date().toISOString(),
      paymentMethods: ['card', 'ussd', 'cash'],
      routeOptimized: true,
      appVersion: '2.1.4',
      deviceType: 'Android',
    },
    {
      id: '2',
      name: 'Mary Okon',
      employeeId: 'COL-002',
      contactPhone: '+234-802-234-5678',
      contactEmail: 'mary.okon@amac.ng',
      assignedZone: 'A',
      status: 'active',
      totalCollections: 38700000,
      todayCollections: 142000,
      monthlyTarget: 4200000,
      monthlyProgress: 88,
      performanceRating: 89,
      lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      paymentMethods: ['card', 'bank_transfer', 'ussd'],
      routeOptimized: true,
      appVersion: '2.1.4',
      deviceType: 'iOS',
    },
    {
      id: '3',
      name: 'David Ibrahim',
      employeeId: 'COL-003',
      contactPhone: '+234-701-345-6789',
      contactEmail: 'david.ibrahim@amac.ng',
      assignedZone: 'B',
      status: 'active',
      totalCollections: 31400000,
      todayCollections: 98000,
      monthlyTarget: 3800000,
      monthlyProgress: 76,
      performanceRating: 82,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      paymentMethods: ['ussd', 'pos'],
      routeOptimized: false,
      appVersion: '2.0.9',
      deviceType: 'Android',
    },
    {
      id: '4',
      name: 'Sarah Musa',
      employeeId: 'COL-004',
      contactPhone: '+234-809-456-7890',
      contactEmail: 'sarah.musa@amac.ng',
      assignedZone: 'C',
      status: 'active',
      totalCollections: 28900000,
      todayCollections: 156000,
      monthlyTarget: 3500000,
      monthlyProgress: 91,
      performanceRating: 91,
      lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      paymentMethods: ['card', 'bank_transfer', 'ussd', 'pos'],
      routeOptimized: true,
      appVersion: '2.1.4',
      deviceType: 'Android',
    },
    {
      id: '5',
      name: 'Ahmed Bello',
      employeeId: 'COL-005',
      contactPhone: '+234-706-567-8901',
      contactEmail: 'ahmed.bello@amac.ng',
      assignedZone: 'D',
      status: 'active',
      totalCollections: 25300000,
      todayCollections: 78000,
      monthlyTarget: 3200000,
      monthlyProgress: 68,
      performanceRating: 74,
      lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      paymentMethods: ['ussd', 'cash'],
      routeOptimized: false,
      appVersion: '2.0.5',
      deviceType: 'Android',
    },
  ]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchCollectors();
    }
  }, [user, isAdmin]);

  const fetchCollectors = async () => {
    try {
      // In a real implementation, this would fetch collectors from the database
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching collectors:', error);
      setIsLoading(false);
    }
  };

  const handleAssignZone = async (collectorId: string, newZone: string) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCollectors(prev => prev.map(collector =>
        collector.id === collectorId
          ? { ...collector, assignedZone: newZone }
          : collector
      ));

      setIsLoading(false);
    } catch (error) {
      console.error('Error assigning zone:', error);
      setIsLoading(false);
    }
  };

  const handleOptimizeRoute = async (collectorId: string) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setCollectors(prev => prev.map(collector =>
        collector.id === collectorId
          ? { ...collector, routeOptimized: true }
          : collector
      ));

      setIsLoading(false);
    } catch (error) {
      console.error('Error optimizing route:', error);
      setIsLoading(false);
    }
  };

  const filteredCollectors = collectors.filter(collector => {
    const matchesSearch = !searchTerm ||
      collector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collector.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collector.contactPhone.includes(searchTerm) ||
      collector.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesZone = zoneFilter === 'all' || collector.assignedZone === zoneFilter;
    const matchesStatus = statusFilter === 'all' || collector.status === statusFilter;

    return matchesSearch && matchesZone && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">⏸️ Inactive</Badge>;
      case 'on_leave':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🏖️ On Leave</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 90) return 'text-green-600';
    if (rating >= 75) return 'text-yellow-600';
    return 'text-red-600';
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
          <h1 className="text-2xl font-display font-bold">🚶 COLLECTOR MANAGEMENT</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Collector
            </Button>
            <Button>
              <Map className="h-4 w-4 mr-2" />
              Route Optimization
            </Button>
          </div>
        </div>

        {/* Collection Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Total Collectors</h3>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-display font-bold">{collectionStats.totalCollectors}</p>
              <p className="text-sm text-muted-foreground">
                {collectionStats.activeCollectors} active today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Today's Collections</h3>
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-display font-bold text-green-600">
                {formatCurrency(collectionStats.totalCollectionsToday)}
              </p>
              <p className="text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +15% vs yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Average Performance</h3>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-display font-bold text-blue-600">{collectionStats.averagePerformance}%</p>
              <Progress value={collectionStats.averagePerformance} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">App Users</h3>
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-display font-bold text-purple-600">{collectionStats.appUsers}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round((collectionStats.appUsers / collectionStats.totalCollectors) * 100)}% adoption rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Zone Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>ZONE ASSIGNMENTS & COVERAGE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {zoneAssignments.map((zone) => (
                <div key={zone.zone} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Zone {zone.zone}</h4>
                    <Badge variant="outline">{zone.collectorCount} collectors</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxpayers:</span>
                      <span className="font-medium">{zone.totalTaxpayers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Coverage:</span>
                      <span className="font-medium">{zone.coverageRate}%</span>
                    </div>
                    <Progress value={zone.coverageRate} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>Avg Performance:</span>
                      <span className={`font-medium ${getPerformanceColor(zone.averagePerformance)}`}>
                        {zone.averagePerformance}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, Employee ID, Phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collectors Table */}
        <Card>
          <CardHeader>
            <CardTitle>COLLECTOR PERFORMANCE ({filteredCollectors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collector</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Today's Collections</TableHead>
                  <TableHead>Monthly Progress</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>App Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollectors.map((collector) => (
                  <TableRow key={collector.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{collector.name}</p>
                        <p className="text-sm text-muted-foreground">{collector.employeeId}</p>
                        <p className="text-xs text-muted-foreground">{collector.contactPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">Zone {collector.assignedZone}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(collector.status)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(collector.todayCollections)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{collector.monthlyProgress}%</span>
                          <span>{formatCurrency(collector.monthlyTarget)}</span>
                        </div>
                        <Progress value={collector.monthlyProgress} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${getPerformanceColor(collector.performanceRating)}`}>
                        {collector.performanceRating}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={collector.routeOptimized ? "secondary" : "destructive"} className="text-xs">
                          {collector.routeOptimized ? 'Optimized' : 'Needs Optimization'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {collector.appVersion} • {collector.deviceType}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Select onValueChange={(value) => handleAssignZone(collector.id, value)}>
                          <SelectTrigger className="w-20 h-8">
                            <MapPin className="h-3 w-3" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">Zone A</SelectItem>
                            <SelectItem value="B">Zone B</SelectItem>
                            <SelectItem value="C">Zone C</SelectItem>
                            <SelectItem value="D">Zone D</SelectItem>
                          </SelectContent>
                        </Select>
                        {!collector.routeOptimized && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Optimize Route"
                            onClick={() => handleOptimizeRoute(collector.id)}
                            disabled={isLoading}
                          >
                            <Activity className="h-4 w-4" />
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
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Report
            </Button>
            <Button variant="outline">
              <Map className="h-4 w-4 mr-2" />
              Route Planning
            </Button>
          </div>
          <Button>
            <Activity className="h-4 w-4 mr-2" />
            Field Operations Dashboard
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
