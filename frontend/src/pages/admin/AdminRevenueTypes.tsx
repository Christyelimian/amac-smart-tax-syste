import React from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote } from 'lucide-react';

export default function AdminRevenueTypes() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">💰 51 REVENUE TYPES MANAGEMENT</h1>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Banknote className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Revenue Types Configuration</h3>
            <p className="text-muted-foreground">
              Manage all 51 municipal revenue types, categories, and pricing.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
