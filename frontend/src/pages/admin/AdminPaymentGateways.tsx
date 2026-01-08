import React from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function AdminPaymentGateways() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">💳 PAYMENT GATEWAYS</h1>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Payment Gateway Management</h3>
            <p className="text-muted-foreground">
              Configure payment gateways, webhooks, and integration settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
