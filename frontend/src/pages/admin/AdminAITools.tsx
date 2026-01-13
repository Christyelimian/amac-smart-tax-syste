import React from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default function AdminAITools() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">🤖 AI TOOLS</h1>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Lightbulb className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">AI-Powered Analytics</h3>
            <p className="text-muted-foreground">
              Fraud detection, revenue forecasting, smart insights, and routing optimization.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
