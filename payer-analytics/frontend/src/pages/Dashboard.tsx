import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

import { apiService } from '../services/api';

interface AnalyticsOverview {
  total_payers: number;
  total_revenue: number;
  payers_by_category: Record<string, {
    name: string;
    count: number;
    revenue: number;
    color: string;
  }>;
  payers_by_zone: Array<{
    zone: string;
    count: number;
    revenue: number;
  }>;
  top_performing_categories: Array<{
    category: string;
    revenue: number;
    growth: number;
  }>;
  data_sources: any[];
  last_updated: string | null;
  message?: string;
}

const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await apiService.getAnalyticsOverview();
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={subtitle ? 1 : 2}>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              mr: 2,
              color: 'white',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Payers"
            value={analytics?.total_payers || 0}
            subtitle="Registered taxpayers"
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`₦${((analytics?.total_revenue || 0) / 1000000).toFixed(1)}M`}
            subtitle="Annual collection target"
            icon={<MoneyIcon />}
            color="#388e3c"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue Categories"
            value={Object.keys(analytics?.payers_by_category || {}).length}
            subtitle="AMAC revenue sources"
            icon={<CategoryIcon />}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Zones Covered"
            value={analytics?.payers_by_zone.length || 0}
            subtitle="Geographic coverage"
            icon={<LocationIcon />}
            color="#7b1fa2"
          />
        </Grid>
      </Grid>

      {/* AMAC Revenue Categories */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        AMAC Revenue Categories (51 Sources)
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {analytics?.payers_by_category && Object.entries(analytics.payers_by_category).map(([key, category]) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
            <Card sx={{
              height: '100%',
              borderLeft: `4px solid ${category.color}`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <BusinessIcon sx={{ mr: 1, color: category.color }} />
                  <Typography variant="h6" component="div" sx={{ fontSize: '0.9rem' }}>
                    {category.name}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" fontWeight="bold" color="primary">
                  {category.count}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Registered businesses
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  ₦{(category.revenue / 1000).toFixed(0)}K revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Zone
              </Typography>
              {analytics?.payers_by_zone.length ? (
                analytics.payers_by_zone
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((zone) => (
                  <Box key={zone.zone} display="flex" justifyContent="space-between" mb={1}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {zone.zone || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {zone.count} businesses
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      ₦{(zone.revenue / 1000000).toFixed(1)}M
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No zone data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Categories
              </Typography>
              {analytics?.top_performing_categories?.length ? (
                analytics.top_performing_categories.map((category, index) => (
                  <Box key={category.category} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ minWidth: '20px', fontWeight: 'bold', color: 'text.secondary' }}>
                        #{index + 1}
                      </Typography>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {category.category}
                        </Typography>
                        <Typography variant="caption" color="success.main">
                          +{category.growth}% growth
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      ₦{(category.revenue / 1000000).toFixed(1)}M
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No performance data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Sources Summary */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Data Sources
        </Typography>
        <Grid container spacing={2}>
          {analytics?.data_sources?.map((source) => (
            <Grid item xs={12} sm={6} md={3} key={source.name}>
              <Card variant="outlined">
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {source.name}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {source.count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {new Date(source.last_updated).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {analytics?.last_updated && (
        <Box mt={4}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date(analytics.last_updated).toLocaleString()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
