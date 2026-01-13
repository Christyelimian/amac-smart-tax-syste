import React from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6 fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of system administration and management</p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <p className="text-muted-foreground">Admin dashboard functionality coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
