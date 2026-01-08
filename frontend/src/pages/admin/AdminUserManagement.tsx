import React from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCog } from 'lucide-react';

export default function AdminUserManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">👥 USER MANAGEMENT</h1>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <UserCog className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">User Administration</h3>
            <p className="text-muted-foreground">
              Manage users, roles, permissions, and activity logs.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
