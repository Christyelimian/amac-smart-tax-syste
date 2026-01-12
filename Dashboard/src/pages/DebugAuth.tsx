import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function DebugAuth() {
  const { user, session, profile, roles, isAdmin, isLoading: authLoading } = useAuth();
  const [dbTest, setDbTest] = useState<{ status: 'loading' | 'success' | 'error'; message: string }>({
    status: 'loading',
    message: 'Testing database connection...'
  });
  const [rolesTest, setRolesTest] = useState<{ status: 'loading' | 'success' | 'error'; data: any[] | null }>({
    status: 'loading',
    data: null
  });

  useEffect(() => {
    testDatabaseConnection();
    testUserRoles();
  }, [user]);

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').single();
      if (error) {
        setDbTest({ status: 'error', message: `Database error: ${error.message}` });
      } else {
        setDbTest({ status: 'success', message: 'Database connection successful' });
      }
    } catch (err) {
      setDbTest({ status: 'error', message: `Connection failed: ${err}` });
    }
  };

  const testUserRoles = async () => {
    if (!user) {
      setRolesTest({ status: 'error', data: null });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        setRolesTest({ status: 'error', data: null });
      } else {
        setRolesTest({ status: 'success', data });
      }
    } catch (err) {
      setRolesTest({ status: 'error', data: null });
    }
  };

  const StatusIcon = ({ status }: { status: 'loading' | 'success' | 'error' }) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🔍 Admin Auth Debug</h1>
        
        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusIcon status={authLoading ? 'loading' : user ? 'success' : 'error'} />
              <span>
                {authLoading ? 'Loading...' : user ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>
            
            {user && (
              <div className="space-y-2 text-sm">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
            )}
            
            {session && (
              <div className="space-y-2 text-sm">
                <p><strong>Session Active:</strong> Yes</p>
                <p><strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Data */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Data</CardTitle>
          </CardHeader>
          <CardContent>
            {profile ? (
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {profile.full_name || 'Not set'}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
                <p><strong>Zone:</strong> {profile.zone || 'Not set'}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No profile data found</p>
            )}
          </CardContent>
        </Card>

        {/* User Roles */}
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Roles from Context:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={roles.length > 0 ? 'success' : 'error'} />
                <span>{roles.length > 0 ? `${roles.length} role(s)` : 'No roles'}</span>
              </div>
            </div>
            
            {roles.length > 0 && (
              <div className="space-y-1">
                {roles.map((role, index) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded">
                    <strong>Role:</strong> {role.role}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span>Admin Status:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={isAdmin ? 'success' : 'error'} />
                <span>{isAdmin ? 'Admin ✅' : 'Not Admin ❌'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Database Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Database Connection:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={dbTest.status} />
                <span className="text-sm">{dbTest.message}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>User Roles Query:</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={rolesTest.status} />
                <span className="text-sm">
                  {rolesTest.status === 'success' 
                    ? `${rolesTest.data?.length || 0} roles found` 
                    : rolesTest.status === 'loading' 
                    ? 'Testing...' 
                    : 'Failed'
                  }
                </span>
              </div>
            </div>
            
            {rolesTest.data && rolesTest.data.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">Raw roles data:</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(rolesTest.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Supabase URL:</span>
              <span className="text-sm font-mono">
                {import.meta.env.VITE_SUPABASE_URL ? 'Set ✅' : 'Missing ❌'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Supabase Key:</span>
              <span className="text-sm font-mono">
                {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Set ✅' : 'Missing ❌'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p><strong>If you see blank admin pages:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Check that you're authenticated above</li>
                <li>Verify you have admin roles in the database</li>
                <li>Ensure environment variables are set</li>
                <li>Check database RLS policies</li>
              </ol>
            </div>
            
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
              Go to Login Page
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}