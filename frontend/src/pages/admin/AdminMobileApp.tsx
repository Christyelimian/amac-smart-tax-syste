import React from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone } from 'lucide-react';

export default function AdminMobileApp() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">📱 MOBILE APP</h1>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Smartphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Mobile Application Management</h3>
            <p className="text-muted-foreground">
              Collector app, active users, and mobile app analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
