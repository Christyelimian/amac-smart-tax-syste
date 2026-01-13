import React from 'react';
import { Typography, Box, Paper, Grid, Button, Card, CardContent } from '@mui/material';
import { CloudDownload as ScrapingIcon, PlayArrow as StartIcon } from '@mui/icons-material';

const Scraping: React.FC = () => {
  const handleStartScraping = (source: string) => {
    console.log(`Starting scraping for ${source}`);
    // TODO: Implement scraping job start
  };

  const dataSources = [
    {
      name: 'Government Directories',
      description: 'Official government business and taxpayer registries',
      status: 'Ready',
      lastRun: 'Never',
    },
    {
      name: 'Business Listings',
      description: 'Online business directories and yellow pages',
      status: 'Ready',
      lastRun: 'Never',
    },
    {
      name: 'Social Media',
      description: 'Business profiles from social media platforms',
      status: 'Ready',
      lastRun: 'Never',
    },
    {
      name: 'Google Business API',
      description: 'Google My Business data (Phase 2)',
      status: 'Coming Soon',
      lastRun: 'N/A',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Scraping Management
      </Typography>

      <Grid container spacing={3}>
        {dataSources.map((source) => (
          <Grid item xs={12} md={6} key={source.name}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ScrapingIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{source.name}</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {source.description}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2">
                    Status: <strong>{source.status}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Last Run: {source.lastRun}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<StartIcon />}
                  disabled={source.status === 'Coming Soon'}
                  onClick={() => handleStartScraping(source.name)}
                  fullWidth
                >
                  {source.status === 'Coming Soon' ? 'Coming Soon' : 'Start Scraping'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Scraping Status Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor active scraping jobs, view completed runs, and manage data collection schedules.
            Phase 1 focuses on reliable public data sources, with Google APIs integrated in Phase 2.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Scraping;
