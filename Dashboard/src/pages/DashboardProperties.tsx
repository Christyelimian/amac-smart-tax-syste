import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { revenueTypes, zones, propertyTypes, formatCurrency, formatDate } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Building2,
  Home,
  Car,
  Loader2,
  CreditCard,
  MapPin,
  Calendar,
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  property_type: 'business' | 'property' | 'vehicle';
  revenue_type: string;
  zone: string;
  registration_number: string | null;
  address: string | null;
  amount_due: number;
  due_date: string | null;
  status: string;
}

const propertyIcons = {
  business: Building2,
  property: Home,
  vehicle: Car,
};

export default function DashboardProperties() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    property_type: '' as 'business' | 'property' | 'vehicle' | '',
    revenue_type: '',
    zone: '',
    registration_number: '',
    address: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('user_properties')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties((data as Property[]) || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.property_type || !formData.revenue_type || !formData.zone) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const revenueInfo = revenueTypes.find((r) => r.id === formData.revenue_type);
      const zoneInfo = zones.find((z) => z.id === formData.zone);
      const baseAmount = revenueInfo?.baseAmount || 10000;
      const multiplier = zoneInfo?.multiplier || 1;
      const amountDue = baseAmount * multiplier;

      const dueDate = new Date();
      dueDate.setFullYear(dueDate.getFullYear() + 1);

      const { error } = await supabase.from('user_properties').insert([{
        user_id: user!.id,
        name: formData.name,
        property_type: formData.property_type,
        revenue_type: formData.revenue_type,
        zone: formData.zone as 'a' | 'b' | 'c' | 'd',
        registration_number: formData.registration_number || null,
        address: formData.address || null,
        amount_due: amountDue,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
      }]);

      if (error) throw error;

      toast({
        title: 'Property added',
        description: 'Your property has been registered successfully',
      });

      setFormData({
        name: '',
        property_type: '',
        revenue_type: '',
        zone: '',
        registration_number: '',
        address: '',
      });
      setIsDialogOpen(false);
      fetchProperties();
    } catch (error) {
      console.error('Error adding property:', error);
      toast({
        title: 'Error',
        description: 'Failed to add property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPropertyStatus = (property: Property): 'active' | 'expired' | 'overdue' => {
    if (!property.due_date) return 'active';
    const dueDate = new Date(property.due_date);
    const today = new Date();
    if (dueDate < today) return 'overdue';
    return 'active';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Properties</h1>
            <p className="text-muted-foreground">Manage your registered properties and businesses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Property</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property/Business Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., ABC Supermarket"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property Type *</Label>
                    <Select
                      value={formData.property_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, property_type: value as 'business' | 'property' | 'vehicle' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.icon} {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Zone *</Label>
                    <Select
                      value={formData.zone}
                      onValueChange={(value) => setFormData({ ...formData, zone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            Zone {zone.id.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Revenue Type *</Label>
                  <Select
                    value={formData.revenue_type}
                    onValueChange={(value) => setFormData({ ...formData, revenue_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select revenue type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {revenueTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration">Registration Number (Optional)</Label>
                  <Input
                    id="registration"
                    placeholder="e.g., BN-123456"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter property address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Property'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No properties registered</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Add your first property or business to start managing your tax obligations
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => {
              const Icon = propertyIcons[property.property_type] || Building2;
              const revenueInfo = revenueTypes.find((r) => r.id === property.revenue_type);
              const status = getPropertyStatus(property);

              return (
                <Card key={property.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-display">{property.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {revenueInfo?.icon} {revenueInfo?.name || property.revenue_type}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Zone {property.zone?.toUpperCase()}
                    </div>
                    {property.due_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due: {formatDate(property.due_date)}
                      </div>
                    )}
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Amount Due</span>
                        <span className="text-lg font-bold">{formatCurrency(property.amount_due || 0)}</span>
                      </div>
                      <Button className="w-full" size="sm">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
