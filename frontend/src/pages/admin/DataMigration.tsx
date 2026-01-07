import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  AlertCircle,
  Loader
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationStats {
  totalPayments: number;
  migratedAssessments: number;
  linkedPayments: number;
  demandNotices: number;
  businessProperties: number;
}

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

const DataMigration = () => {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [steps, setSteps] = useState<MigrationStep[]>([
    {
      id: 'backup',
      name: 'Create Data Backup',
      description: 'Backup existing payments and payment history',
      status: 'pending'
    },
    {
      id: 'assessments',
      name: 'Create Assessments',
      description: 'Generate assessments from historical payments',
      status: 'pending'
    },
    {
      id: 'link_payments',
      name: 'Link Payments',
      description: 'Connect payments to their corresponding assessments',
      status: 'pending'
    },
    {
      id: 'demand_notices',
      name: 'Generate Demand Notices',
      description: 'Create retrospective demand notices for assessments',
      status: 'pending'
    },
    {
      id: 'business_registry',
      name: 'Create Business Registry',
      description: 'Build business/property registry from migrated data',
      status: 'pending'
    }
  ]);

  useEffect(() => {
    fetchMigrationStats();
  }, []);

  const fetchMigrationStats = async () => {
    try {
      setLoading(true);

      // Get total payments
      const { count: totalPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true });

      // Get migrated assessments
      const { count: migratedAssessments } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('calculation_method', 'migrated_from_old_system');

      // Get linked payments
      const { count: linkedPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .not('assessment_id', 'is', null);

      // Get demand notices
      const { count: demandNotices } = await supabase
        .from('demand_notices')
        .select('*', { count: 'exact', head: true });

      // Get business properties
      const { count: businessProperties } = await supabase
        .from('business_properties')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalPayments: totalPayments || 0,
        migratedAssessments: migratedAssessments || 0,
        linkedPayments: linkedPayments || 0,
        demandNotices: demandNotices || 0,
        businessProperties: businessProperties || 0
      });

    } catch (error) {
      console.error('Error fetching migration stats:', error);
      toast.error('Failed to load migration statistics');
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setMigrating(true);
    toast.info('Starting data migration... This may take a few minutes.');

    try {
      // Step 1: Create backup
      setSteps(prev => prev.map(step =>
        step.id === 'backup'
          ? { ...step, status: 'running' }
          : step
      ));

      const { error: backupError } = await supabase.rpc('create_migration_backup');
      if (backupError) throw new Error(`Backup failed: ${backupError.message}`);

      setSteps(prev => prev.map(step =>
        step.id === 'backup'
          ? { ...step, status: 'completed' }
          : step
      ));

      // Step 2: Create assessments
      setSteps(prev => prev.map(step =>
        step.id === 'assessments'
          ? { ...step, status: 'running' }
          : step
      ));

      const { error: assessmentError } = await supabase.rpc('migrate_payments_to_assessments');
      if (assessmentError) throw new Error(`Assessment creation failed: ${assessmentError.message}`);

      setSteps(prev => prev.map(step =>
        step.id === 'assessments'
          ? { ...step, status: 'completed' }
          : step
      ));

      // Step 3: Link payments
      setSteps(prev => prev.map(step =>
        step.id === 'link_payments'
          ? { ...step, status: 'running' }
          : step
      ));

      const { error: linkError } = await supabase.rpc('link_payments_to_assessments');
      if (linkError) throw new Error(`Payment linking failed: ${linkError.message}`);

      setSteps(prev => prev.map(step =>
        step.id === 'link_payments'
          ? { ...step, status: 'completed' }
          : step
      ));

      // Step 4: Generate demand notices
      setSteps(prev => prev.map(step =>
        step.id === 'demand_notices'
          ? { ...step, status: 'running' }
          : step
      ));

      const { error: noticeError } = await supabase.rpc('generate_retrospective_demand_notices');
      if (noticeError) throw new Error(`Demand notice generation failed: ${noticeError.message}`);

      setSteps(prev => prev.map(step =>
        step.id === 'demand_notices'
          ? { ...step, status: 'completed' }
          : step
      ));

      // Step 5: Create business registry
      setSteps(prev => prev.map(step =>
        step.id === 'business_registry'
          ? { ...step, status: 'running' }
          : step
      ));

      const { error: registryError } = await supabase.rpc('create_business_registry_from_migration');
      if (registryError) throw new Error(`Business registry creation failed: ${registryError.message}`);

      setSteps(prev => prev.map(step =>
        step.id === 'business_registry'
          ? { ...step, status: 'completed' }
          : step
      ));

      toast.success('Data migration completed successfully!');
      await fetchMigrationStats(); // Refresh stats

    } catch (error) {
      console.error('Migration error:', error);
      toast.error(error instanceof Error ? error.message : 'Migration failed');

      // Mark failed step as error
      setSteps(prev => prev.map(step =>
        step.status === 'running'
          ? { ...step, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
          : step
      ));
    } finally {
      setMigrating(false);
    }
  };

  const downloadMigrationReport = () => {
    if (!stats) return;

    const report = `
AMAC Data Migration Report
Generated: ${new Date().toLocaleString()}

MIGRATION STATISTICS:
=====================
Total Payments: ${stats.totalPayments}
Migrated Assessments: ${stats.migratedAssessments}
Linked Payments: ${stats.linkedPayments}
Demand Notices Generated: ${stats.demandNotices}
Business Properties Created: ${stats.businessProperties}

MIGRATION STATUS: ${stats.migratedAssessments > 0 ? 'COMPLETED' : 'PENDING'}
Coverage: ${stats.totalPayments > 0 ? ((stats.linkedPayments / stats.totalPayments) * 100).toFixed(1) : 0}% of payments migrated

RECOMMENDATIONS:
${stats.migratedAssessments === 0 ? '- Run full migration to convert old system data' : ''}
${stats.demandNotices === 0 ? '- Generate demand notices for migrated assessments' : ''}
${stats.businessProperties === 0 ? '- Create business registry for better organization' : ''}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amac-migration-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-[#006838] mx-auto mb-4" />
          <p className="text-gray-600">Loading migration statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Migration</h1>
              <p className="text-gray-600">Convert old payments to assessment system</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPayments.toLocaleString()}</p>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Migrated Assessments</p>
                  <p className="text-2xl font-bold text-green-600">{stats.migratedAssessments.toLocaleString()}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Linked Payments</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.linkedPayments.toLocaleString()}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Demand Notices</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.demandNotices.toLocaleString()}</p>
                </div>
                <Download className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Business Registry</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.businessProperties.toLocaleString()}</p>
                </div>
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>
        )}

        {/* Migration Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Migration Status</h2>
            <button
              onClick={downloadMigrationReport}
              className="text-[#006838] hover:text-[#005a2d] text-sm font-medium"
            >
              Download Report
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' :
                  step.status === 'running' ? 'bg-blue-100 text-blue-600' :
                  step.status === 'error' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : step.status === 'running' ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : step.status === 'error' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{step.name}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  {step.error && (
                    <p className="text-sm text-red-600 mt-1">{step.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Migration Controls */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Run Migration</h2>
              <p className="text-gray-600">Convert existing payment data to assessment system</p>
            </div>
          </div>

          {/* Warnings */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Migration will create backup tables automatically</li>
                  <li>• Existing data will remain intact during migration</li>
                  <li>• Process may take several minutes for large datasets</li>
                  <li>• Migration is one-way; rollback scripts are available if needed</li>
                  <li>• Test migration on development environment first</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Migration Button */}
          <div className="flex gap-3">
            <button
              onClick={runMigration}
              disabled={migrating}
              className="bg-[#006838] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#005a2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {migrating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Running Migration...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Start Migration
                </>
              )}
            </button>

            <button
              onClick={fetchMigrationStats}
              disabled={migrating}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Refresh Stats
            </button>
          </div>

          {/* Progress Indicator */}
          {migrating && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-[#006838] h-2 rounded-full animate-pulse"
                     style={{ width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` }}>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataMigration;
